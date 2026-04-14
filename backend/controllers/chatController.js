import { pool } from '../config/database.js';

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

export const listConversations = async (req, res) => {
  const userId = req.userId;
  try {
    const { rows: convs } = await pool.query(
      `SELECT c.id, c.created_at
       FROM conversaciones c
       INNER JOIN participantes_conversacion pc
         ON pc.conversacion_id = c.id AND pc.usuario_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );

    const enriched = [];
    for (const c of convs) {
      const peer = await pool.query(
        `SELECT u.id, u.nombre, u.foto_perfil
         FROM participantes_conversacion pcp
         INNER JOIN usuarios u ON u.id = pcp.usuario_id
         WHERE pcp.conversacion_id = $1 AND pcp.usuario_id <> $2
         LIMIT 1`,
        [c.id, userId]
      );

      const last = await pool.query(
        `SELECT contenido, created_at, remitente_id
         FROM mensajes
         WHERE conversacion_id = $1
         ORDER BY created_at DESC NULLS LAST
         LIMIT 1`,
        [c.id]
      );

      enriched.push({
        id: c.id,
        created_at: c.created_at,
        peer: peer.rows[0] || null,
        ultimo_mensaje: last.rows[0]?.contenido || null,
        ultimo_mensaje_at: last.rows[0]?.created_at || null,
      });
    }

    enriched.sort((a, b) => {
      const ta = a.ultimo_mensaje_at ? new Date(a.ultimo_mensaje_at).getTime() : 0;
      const tb = b.ultimo_mensaje_at ? new Date(b.ultimo_mensaje_at).getTime() : 0;
      return tb - ta;
    });

    res.json({ conversaciones: enriched });
  } catch (error) {
    console.error('listConversations:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getOrCreateConversation = async (req, res) => {
  const userId = req.userId;
  const { otro_usuario_id: otroUsuarioId } = req.body;

  if (!otroUsuarioId || otroUsuarioId === userId) {
    return res.status(400).json({ message: 'Usuario destinatario inválido' });
  }

  try {
    const exists = await pool.query('SELECT id FROM usuarios WHERE id = $1', [otroUsuarioId]);
    if (!exists.rows.length) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    let convId = await findExistingDmConversation(userId, otroUsuarioId);
    if (!convId) {
      let ins;
      try {
        ins = await pool.query(`INSERT INTO conversaciones DEFAULT VALUES RETURNING id`);
      } catch {
        ins = await pool.query(
          `INSERT INTO conversaciones (id, created_at) VALUES (gen_random_uuid(), NOW()) RETURNING id`
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

    res.status(201).json({ mensaje: { ...rows[0], ...u.rows[0] } });
  } catch (error) {
    console.error('sendMessage:', error);
    res.status(500).json({ message: error.message });
  }
};
