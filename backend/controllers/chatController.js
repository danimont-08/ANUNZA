import { pool } from '../config/database.js';
import { getIo } from '../socket.js';

async function findExistingDmConversation(userA, userB) {
  const { rows } = await pool.query(
    `SELECT pc1.conversacion_id FROM participantes_conversacion pc1
     INNER JOIN participantes_conversacion pc2
       ON pc1.conversacion_id = pc2.conversacion_id WHERE pc1.usuario_id = $1 AND pc2.usuario_id = $2
     LIMIT 1`,
    [userA, userB]
  );
  return rows[0]?.conversacion_id || null;
}

async function assertParticipant(conversacionId, userId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM participantes_conversacion     WHERE conversacion_id = $1 AND usuario_id = $2`,
    [conversacionId, userId]
  );
  return rows.length > 0;
}

/** Lista usuarios activos para iniciar un chat (sin datos sensibles). */
export const listUsersForChat = async (req, res) => {
  const userId = req.userId;
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, correo, foto_perfil
       FROM usuarios
       WHERE id <> $1
         AND COALESCE(estado, 'activo') = 'activo'
       ORDER BY nombre ASC`,
      [userId]
    );
    res.json({ users: rows });
  } catch (error) {
    console.error('listUsersForChat:', error);
    res.status(500).json({ message: error.message });
  }
};

export const listConversations = async (req, res) => {
  const userId = req.userId;
  try {
    // Solo conversaciones que tienen al menos un mensaje enviado por otra persona
    const { rows } = await pool.query(
      `SELECT
         c.id,
         c.created_at,
         c.publicacion_id,
         u.id          AS peer_id,
         u.nombre      AS peer_nombre,
         u.foto_perfil AS peer_foto,
         m.contenido   AS ultimo_mensaje,
         m.created_at  AS ultimo_mensaje_at,
         p.titulo      AS publicacion_titulo
       FROM conversaciones c
       INNER JOIN participantes_conversacion pc
         ON pc.conversacion_id = c.id AND pc.usuario_id = $1
       LEFT JOIN participantes_conversacion pcp
         ON pcp.conversacion_id = c.id AND pcp.usuario_id <> $1
       LEFT JOIN usuarios u ON u.id = pcp.usuario_id
       LEFT JOIN publicaciones p ON p.id = c.publicacion_id
       LEFT JOIN LATERAL (
         SELECT contenido, created_at
         FROM mensajes
         WHERE conversacion_id = c.id
         ORDER BY created_at DESC NULLS LAST
         LIMIT 1
       ) m ON true
       WHERE EXISTS (
         SELECT 1 FROM mensajes msg WHERE msg.conversacion_id = c.id
       )
       ORDER BY COALESCE(m.created_at, c.created_at) DESC NULLS LAST`,
      [userId]
    );

    const conversaciones = rows.map((r) => ({
      id: r.id,
      created_at: r.created_at,
      publicacion_id: r.publicacion_id,
      publicacion_titulo: r.publicacion_titulo,
      peer: r.peer_id ? { id: r.peer_id, nombre: r.peer_nombre, foto_perfil: r.peer_foto } : null,
      ultimo_mensaje: r.ultimo_mensaje || null,
      ultimo_mensaje_at: r.ultimo_mensaje_at || null,
    }));

    res.json({ conversaciones });
  } catch (error) {
    console.error('listConversations:', error);
    res.status(500).json({ message: error.message });
  }
};


export const getOrCreateConversation = async (req, res) => {
  const userId = req.userId;
  const { otro_usuario_id: otroUsuarioId, publicacion_id: publicacionId } = req.body;

  if (!otroUsuarioId || otroUsuarioId === userId) {
    return res.status(400).json({ message: 'Usuario destinatario inválido' });
  }

  try {
    const exists = await pool.query('SELECT id FROM usuarios WHERE id = $1', [otroUsuarioId]);
    if (!exists.rows.length) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si hay bloqueo mutuo
    const bloqueo = await pool.query(
      `SELECT 1 FROM bloqueos_usuarios 
       WHERE (usuario_que_bloquea = $1 AND usuario_bloqueado = $2)
          OR (usuario_que_bloquea = $2 AND usuario_bloqueado = $1)`,
      [userId, otroUsuarioId]
    );

    if (bloqueo.rows.length) {
      return res.status(403).json({ message: 'No puedes iniciar una conversación con este usuario porque está bloqueado' });
    }

    // VALIDAR LÍMITE DE 20 CHATS NUEVOS POR DÍA
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const chatsHoy = await pool.query(
      `SELECT COUNT(*) as cnt FROM conversaciones c
       INNER JOIN participantes_conversacion pc ON pc.conversacion_id = c.id
       WHERE pc.usuario_id = $1 
         AND c.created_at >= $2
         AND NOT EXISTS (
           SELECT 1 FROM mensajes WHERE conversacion_id = c.id
         )
       GROUP BY pc.usuario_id`,
      [userId, today.toISOString()]
    );

    const chatCount = chatsHoy.rows[0]?.cnt || 0;
    if (chatCount >= 20) {
      return res.status(429).json({ 
        message: 'Has alcanzado el límite de 20 chats nuevos por día. Intenta mañana.',
        limite_alcanzado: true 
      });
    }

    let convId = await findExistingDmConversation(userId, otroUsuarioId);
    if (!convId) {
      let ins;
      try {
        ins = await pool.query(
          `INSERT INTO conversaciones (publicacion_id) VALUES ($1) RETURNING id`,
          [publicacionId || null]
        );
      } catch {
        ins = await pool.query(
          `INSERT INTO conversaciones (id, created_at, publicacion_id) VALUES (gen_random_uuid(), NOW(), $1) RETURNING id`,
          [publicacionId || null]
        );
      }
      convId = ins.rows[0].id;
      await pool.query(
        `INSERT INTO participantes_conversacion (conversacion_id, usuario_id) VALUES ($1, $2), ($1, $3)`,
        [convId, userId, otroUsuarioId]
      );
    }

    res.json({ conversacion_id: convId });
  } catch (error) {
    console.error('getOrCreateConversation:', error);
    res.status(500).json({ message: error.message });
  }
};

export const listMessages = async (req, res) => {
  const userId = req.userId;
  const { conversacionId } = req.params;

  try {
    const ok = await assertParticipant(conversacionId, userId);
    if (!ok) {
      return res.status(403).json({ message: 'No participas en esta conversación' });
    }

    const { rows } = await pool.query(
      `SELECT m.id, m.conversacion_id, m.remitente_id, m.contenido, m.tipo, m.created_at,
              u.nombre AS remitente_nombre, u.foto_perfil AS remitente_foto
       FROM mensajes m
       INNER JOIN usuarios u ON u.id = m.remitente_id
       WHERE m.conversacion_id = $1
       ORDER BY m.created_at ASC NULLS LAST`,
      [conversacionId]
    );

    res.json({ mensajes: rows });
  } catch (error) {
    console.error('listMessages:', error);
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  const userId = req.userId;
  const { conversacionId } = req.params;
  const { contenido, tipo } = req.body;

  if (!contenido || !String(contenido).trim()) {
    return res.status(400).json({ message: 'El mensaje no puede estar vacío' });
  }

  try {
    const ok = await assertParticipant(conversacionId, userId);
    if (!ok) {
      return res.status(403).json({ message: 'No participas en esta conversación' });
    }

    // Verificar bloqueos
    const otro = await pool.query(
      `SELECT usuario_id FROM participantes_conversacion
       WHERE conversacion_id = $1 AND usuario_id <> $2`,
      [conversacionId, userId]
    );

    if (otro.rows.length) {
      const otroUsuarioId = otro.rows[0].usuario_id;
      const bloqueado = await pool.query(
        `SELECT 1 FROM bloqueos_usuarios 
         WHERE usuario_que_bloquea = $1 AND usuario_bloqueado = $2`,
        [userId, otroUsuarioId]
      );

      if (bloqueado.rows.length) {
        return res.status(403).json({ message: 'No puedes enviar mensajes a este usuario porque está bloqueado' });
      }

      const teBloqueo = await pool.query(
        `SELECT 1 FROM bloqueos_usuarios 
         WHERE usuario_que_bloquea = $1 AND usuario_bloqueado = $2`,
        [otroUsuarioId, userId]
      );

      if (teBloqueo.rows.length) {
        return res.status(403).json({ message: 'Este usuario te ha bloqueado' });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO mensajes (conversacion_id, remitente_id, contenido, tipo)
       VALUES ($1, $2, $3, COALESCE($4, 'texto'))
       RETURNING id, conversacion_id, remitente_id, contenido, tipo, created_at`,
      [conversacionId, userId, String(contenido).trim(), tipo || 'texto']
    );

    const u = await pool.query(
      `SELECT nombre AS remitente_nombre, foto_perfil AS remitente_foto FROM usuarios WHERE id = $1`,
      [userId]
    );

    // Notificar al otro participante
    try {
      const otro = await pool.query(
        `SELECT usuario_id FROM participantes_conversacion
         WHERE conversacion_id = $1 AND usuario_id <> $2 LIMIT 1`,
        [conversacionId, userId]
      );
      if (otro.rows.length) {
        const nombre = u.rows[0]?.remitente_nombre || 'Alguien';
        await pool.query(
          `INSERT INTO notificaciones (usuario_id, tipo, referencia_id, mensaje)
           VALUES ($1, 'nuevo_mensaje', $2, $3)`,
          [otro.rows[0].usuario_id, conversacionId, `${nombre} te envió un mensaje`]
        );
      }
    } catch { /* no bloquear la respuesta */ }

    const fullMsg = { ...rows[0], ...u.rows[0] };

    // Emitir en tiempo real a todos los participantes del room
    getIo()?.to(`conv:${conversacionId}`).emit('new_message', { mensaje: fullMsg });

    res.status(201).json({ mensaje: fullMsg });
  } catch (error) {
    console.error('sendMessage:', error);
    res.status(500).json({ message: error.message });
  }
};

