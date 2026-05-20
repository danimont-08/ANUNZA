import { pool } from '../config/database.js';
import { enrichPublicacionRow } from '../utils/publicacionPayload.js';

/** Lista todos los reportes con detalle de publicación y/o usuario afectado. */
export const getReportes = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         r.id,
         r.tipo,
         r.objeto_id,
         r.motivo,
         r.detalles,
         r.created_at,
         u_rep.nombre      AS reportado_por,
         -- Cuando tipo = 'publicacion'
         p.id              AS publicacion_id,
         p.titulo          AS publicacion_titulo,
         p.estado          AS publicacion_estado,
         u_due.id          AS dueno_id,
         u_due.nombre      AS dueno_nombre,
         u_due.estado      AS dueno_estado,
         u_due.rol         AS dueno_rol,
         -- Cuando tipo = 'usuario'
         u_obj.id          AS usuario_obj_id,
         u_obj.nombre      AS usuario_obj_nombre,
         u_obj.estado      AS usuario_obj_estado,
         u_obj.rol         AS usuario_obj_rol
       FROM reportes r
       LEFT JOIN usuarios u_rep ON u_rep.id = r.reportado_por
       LEFT JOIN publicaciones p ON r.tipo = 'publicacion' AND p.id = r.objeto_id
       LEFT JOIN usuarios u_due  ON r.tipo = 'publicacion' AND u_due.id = p.usuario_id
       LEFT JOIN usuarios u_obj  ON r.tipo = 'usuario'     AND u_obj.id = r.objeto_id
       ORDER BY r.created_at DESC NULLS LAST
       LIMIT 200`
    );
    res.json({ reportes: rows });
  } catch (error) {
    console.error('getReportes:', error);
    res.status(500).json({ message: error.message });
  }
};

/** Oculta una publicación (estado → 'oculto'). */
export const ocultarPublicacion = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE publicaciones SET estado = 'oculto' WHERE id = $1`, [id]);
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

/** Suspende a un usuario (estado → 'suspendido'). Los moderadores no pueden suspender admins ni otros moderadores. */
export const suspenderUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query(`SELECT rol FROM usuarios WHERE id = $1`, [id]);
    if (!check.rows.length) return res.status(404).json({ message: 'Usuario no encontrado.' });
    if (check.rows[0].rol === 'admin' || check.rows[0].rol === 'moderador') {
      return res.status(403).json({ message: 'No puedes suspender esta cuenta.' });
    }
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

/** Lista todos los usuarios (para panel de moderación). Soporta ?q= y ?estado= */
export const getUsuarios = async (req, res) => {
  try {
    const q = req.query.q ? `%${req.query.q}%` : null;
    const estado = req.query.estado || null;
    const params = [];
    const conditions = [];
    if (q) { params.push(q); conditions.push(`(u.nombre ILIKE $${params.length} OR u.correo ILIKE $${params.length})`); }
    if (estado) { params.push(estado); conditions.push(`u.estado = $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

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
         INNER JOIN publicaciones p2 ON r2.tipo = 'publicacion' AND p2.id = r2.objeto_id
         GROUP BY p2.usuario_id
       ) r ON r.usuario_id = u.id
       ${where}
       ORDER BY u.nombre ASC`,
      params
    );
    res.json({ usuarios: rows });
  } catch (error) {
    console.error('getUsuarios:', error);
    res.status(500).json({ message: error.message });
  }
};

/** Descarta (elimina) un reporte una vez gestionado. */
export const resolverReporte = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM reportes WHERE id = $1`, [id]);
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

/** GET /api/moderador/stats — mismas estadísticas que el admin */
export const getStats = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM usuarios) AS usuarios_total,
        (SELECT COUNT(*)::int FROM usuarios WHERE COALESCE(estado, 'activo') = 'activo') AS usuarios_activos,
        (SELECT COUNT(*)::int FROM usuarios WHERE estado = 'suspendido') AS usuarios_suspendidos,
        (SELECT COUNT(*)::int FROM publicaciones) AS publicaciones_total,
        (SELECT COUNT(*)::int FROM publicaciones WHERE COALESCE(estado, 'activo') = 'activo') AS publicaciones_activas,
        (SELECT COUNT(DISTINCT objeto_id)::int FROM reportes WHERE tipo = 'publicacion') AS publicaciones_reportadas,
        (SELECT COUNT(*)::int FROM reportes) AS reportes_pendientes
    `);
    res.json({ stats: rows[0] });
  } catch (error) {
    console.error('getStats (mod):', error);
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/moderador/publicaciones/:id — detalle de publicación para el modal de revisión */
export const getPublicacion = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.titulo, p.descripcion, p.imagen, p.precio, p.tipo, p.estado,
              p.created_at, p.usuario_id, p.categoria_id,
              u.nombre AS autor_nombre, u.correo AS autor_correo, u.ciudad AS autor_ciudad,
              u.foto_perfil AS autor_foto,
              cat.nombre AS categoria_nombre
       FROM publicaciones p
       INNER JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN categorias cat ON cat.id = p.categoria_id
       WHERE p.id = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Publicación no encontrada' });
    res.json({ publicacion: enrichPublicacionRow(rows[0]) });
  } catch (error) {
    console.error('getPublicacion (mod):', error);
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
       WHERE p.estado = 'oculto'
       ORDER BY p.created_at DESC NULLS LAST`
    );
    res.json({ publicaciones: rows });
  } catch (error) {
    console.error('getPublicacionesOcultas:', error);
    res.status(500).json({ message: error.message });
  }
};
