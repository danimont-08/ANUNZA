import { pool } from '../config/database.js';

/** Lista todos los reportes con detalle de publicación y usuario. */
export const getReportes = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         r.id,
         r.motivo,
         r.descripcion,
         r.estado,
         r.created_at,
         r.publicacion_id,
         p.titulo          AS publicacion_titulo,
         p.descripcion     AS publicacion_descripcion,
         p.estado          AS publicacion_estado,
         u_rep.nombre      AS reportado_por,
         u_rep.id          AS reportado_por_id,
         u_due.id          AS dueno_id,
         u_due.nombre      AS dueno_nombre,
         u_due.estado      AS dueno_estado
       FROM reportes r
       LEFT JOIN publicaciones p    ON p.id = r.publicacion_id
       LEFT JOIN usuarios u_rep     ON u_rep.id = r.usuario_id
       LEFT JOIN usuarios u_due     ON u_due.id = p.usuario_id
       ORDER BY
         CASE r.estado WHEN 'pendiente' THEN 0 ELSE 1 END,
         r.created_at DESC NULLS LAST
       LIMIT 200`
    );
    res.json({ reportes: rows });
  } catch (error) {
    console.error('getReportes:', error);
    res.status(500).json({ message: error.message });
  }
};

/** Oculta una publicación (estado → 'oculta'). */
export const ocultarPublicacion = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE publicaciones SET estado = 'oculta' WHERE id = $1`, [id]);
    res.json({ ok: true, message: 'Publicación ocultada correctamente.' });
  } catch (error) {
    console.error('ocultarPublicacion:', error);
    res.status(500).json({ message: error.message });
  }
};

/** Restaura una publicación ocultada (estado → 'activo'). */
export const mostrarPublicacion = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE publicaciones SET estado = 'activo' WHERE id = $1`, [id]);
    res.json({ ok: true, message: 'Publicación restaurada correctamente.' });
  } catch (error) {
    console.error('mostrarPublicacion:', error);
    res.status(500).json({ message: error.message });
  }
};

/** Suspende a un usuario (estado → 'suspendido'). */
export const suspenderUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE usuarios SET estado = 'suspendido' WHERE id = $1`, [id]);
    res.json({ ok: true, message: 'Usuario suspendido.' });
  } catch (error) {
    console.error('suspenderUsuario:', error);
    res.status(500).json({ message: error.message });
  }
};

/** Reactiva a un usuario suspendido (estado → 'activo'). */
export const levantarSuspension = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE usuarios SET estado = 'activo' WHERE id = $1`, [id]);
    res.json({ ok: true, message: 'Suspensión levantada.' });
  } catch (error) {
    console.error('levantarSuspension:', error);
    res.status(500).json({ message: error.message });
  }
};

/** Lista todos los usuarios (para panel de moderación). */
export const getUsuarios = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.correo, u.ciudad, u.rol, u.estado, u.created_at, u.foto_perfil,
              COALESCE(p.cnt, 0)::int AS total_publicaciones,
              COALESCE(r.cnt, 0)::int AS total_reportes
       FROM usuarios u
       LEFT JOIN (
         SELECT usuario_id, COUNT(*)::int AS cnt FROM publicaciones GROUP BY usuario_id
       ) p ON p.usuario_id = u.id
       LEFT JOIN (
         SELECT p2.usuario_id, COUNT(*)::int AS cnt
         FROM reportes r2
         INNER JOIN publicaciones p2 ON p2.id = r2.publicacion_id
         GROUP BY p2.usuario_id
       ) r ON r.usuario_id = u.id
       ORDER BY u.nombre ASC`
    );
    res.json({ usuarios: rows });
  } catch (error) {
    console.error('getUsuarios:', error);
    res.status(500).json({ message: error.message });
  }
};

/** Marca un reporte como revisado o rechazado. */
export const resolverReporte = async (req, res) => {
  const { id } = req.params;
  const { accion } = req.body;
  // Valores permitidos por el CHECK de la BD: 'pendiente' | 'revisado' | 'rechazado'
  const estadoValido = ['revisado', 'rechazado'].includes(accion) ? accion : 'revisado';
  try {
    await pool.query(
      `UPDATE reportes SET estado = $1 WHERE id = $2`,
      [estadoValido, id]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('resolverReporte:', error);
    res.status(500).json({ message: error.message });
  }
};

/** Obtiene los mensajes de una conversación reportada (vista del moderador). */
export const getMensajesConversacion = async (req, res) => {
  const { conversacionId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT m.id, m.contenido, m.created_at, m.tipo,
              u.nombre AS remitente_nombre, u.foto_perfil AS remitente_foto
       FROM mensajes m
       INNER JOIN usuarios u ON u.id = m.remitente_id
       WHERE m.conversacion_id = $1
       ORDER BY m.created_at ASC NULLS LAST`,
      [conversacionId]
    );
    res.json({ mensajes: rows });
  } catch (error) {
    console.error('getMensajesConversacion:', error);
    res.status(500).json({ message: error.message });
  }
};

/** Lista publicaciones ocultas. */
export const getPublicacionesOcultas = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.titulo, p.descripcion, p.created_at,
              u.nombre AS autor_nombre, u.id AS autor_id
       FROM publicaciones p
       INNER JOIN usuarios u ON u.id = p.usuario_id
       WHERE p.estado = 'oculta'
       ORDER BY p.created_at DESC NULLS LAST`
    );
    res.json({ publicaciones: rows });
  } catch (error) {
    console.error('getPublicacionesOcultas:', error);
    res.status(500).json({ message: error.message });
  }
};
