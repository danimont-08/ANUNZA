import { pool } from '../config/database.js';
import { User } from '../models/User.js';
import { enrichPublicacionRow } from '../utils/publicacionPayload.js';

const ESTADOS_USUARIO = ['activo', 'suspendido'];
const ESTADOS_REPORTE = ['pendiente', 'revisado', 'desestimado'];
const ESTADOS_PUBLICACION = ['activo', 'oculto', 'eliminado'];

/** GET /api/admin/stats */
export const getStats = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM usuarios) AS usuarios_total,
        (SELECT COUNT(*)::int FROM usuarios WHERE COALESCE(estado, 'activo') = 'activo') AS usuarios_activos,
        (SELECT COUNT(*)::int FROM usuarios WHERE estado = 'suspendido') AS usuarios_suspendidos,
        (SELECT COUNT(*)::int FROM publicaciones) AS publicaciones_total,
        (SELECT COUNT(*)::int FROM publicaciones WHERE COALESCE(estado, 'activo') = 'activo') AS publicaciones_activas,
        (SELECT COUNT(DISTINCT publicacion_id)::int FROM reportes) AS publicaciones_reportadas,
        (SELECT COUNT(*)::int FROM reportes WHERE COALESCE(estado, 'pendiente') = 'pendiente') AS reportes_pendientes
    `);
    res.json({ stats: rows[0] });
  } catch (error) {
    console.error('getStats:', error);
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/admin/users?estado=&q= */
export const listUsers = async (req, res) => {
  try {
    const estado = req.query.estado || null;
    const q = req.query.q || null;
    const users = await User.findAll({ estado, q });
    res.json({ users });
  } catch (error) {
    console.error('listUsers:', error);
    res.status(500).json({ message: error.message });
  }
};

/** PATCH /api/admin/users/:id/estado  body: { estado } */
export const patchUserEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado || !ESTADOS_USUARIO.includes(estado)) {
      return res.status(400).json({
        message: `Estado inválido. Opciones: ${ESTADOS_USUARIO.join(', ')}`,
      });
    }

    if (String(id) === String(req.userId) && estado === 'suspendido') {
      return res.status(400).json({ message: 'No puedes suspender tu propia cuenta de administrador' });
    }

    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (target.rol === 'admin' && estado === 'suspendido') {
      return res.status(400).json({ message: 'No se puede suspender una cuenta de administrador' });
    }

    const updated = await User.updateEstado(id, estado);
    res.json({
      message: estado === 'suspendido' ? 'Usuario suspendido' : 'Usuario reactivado',
      user: updated,
    });
  } catch (error) {
    console.error('patchUserEstado:', error);
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/admin/reportes?estado= */
export const listReportes = async (req, res) => {
  try {
    const estado = req.query.estado || null;
    const params = [];
    let where = '';
    if (estado) {
      params.push(estado);
      where = `WHERE COALESCE(r.estado, 'pendiente') = $1`;
    }

    const { rows } = await pool.query(
      `SELECT r.id, r.publicacion_id, r.usuario_id AS reportante_id,
              r.motivo, r.descripcion, r.estado, r.created_at,
              p.titulo AS publicacion_titulo, p.estado AS publicacion_estado,
              p.usuario_id AS publicacion_autor_id,
              u_rep.nombre AS reportante_nombre,
              u_aut.nombre AS autor_nombre
       FROM reportes r
       INNER JOIN publicaciones p ON p.id = r.publicacion_id
       INNER JOIN usuarios u_rep ON u_rep.id = r.usuario_id
       INNER JOIN usuarios u_aut ON u_aut.id = p.usuario_id
       ${where}
       ORDER BY r.created_at DESC
       LIMIT 100`,
      params
    );
    res.json({ reportes: rows });
  } catch (error) {
    console.error('listReportes:', error);
    res.status(500).json({ message: error.message });
  }
};

/** PATCH /api/admin/reportes/:id  body: { estado } */
export const patchReporteEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado || !ESTADOS_REPORTE.includes(estado)) {
      return res.status(400).json({
        message: `Estado inválido. Opciones: ${ESTADOS_REPORTE.join(', ')}`,
      });
    }

    const { rowCount, rows } = await pool.query(
      `UPDATE reportes SET estado = $1 WHERE id = $2
       RETURNING id, publicacion_id, estado`,
      [estado, id]
    );
    if (!rowCount) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    res.json({ message: 'Reporte actualizado', reporte: rows[0] });
  } catch (error) {
    console.error('patchReporteEstado:', error);
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/admin/publicaciones/:id — detalle para moderación (sin ir al feed) */
export const getPublicacionDetalle = async (req, res) => {
  try {
    const { id } = req.params;
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
    if (!rows.length) {
      return res.status(404).json({ message: 'Publicación no encontrada' });
    }
    res.json({ publicacion: enrichPublicacionRow(rows[0]) });
  } catch (error) {
    console.error('getPublicacionDetalle:', error);
    res.status(500).json({ message: error.message });
  }
};

/** PATCH /api/admin/publicaciones/:id  body: { estado } */
export const patchPublicacionEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado || !ESTADOS_PUBLICACION.includes(estado)) {
      return res.status(400).json({
        message: `Estado inválido. Opciones: ${ESTADOS_PUBLICACION.join(', ')}`,
      });
    }

    const { rowCount, rows } = await pool.query(
      `UPDATE publicaciones SET estado = $1 WHERE id = $2
       RETURNING id, titulo, estado, usuario_id`,
      [estado, id]
    );
    if (!rowCount) {
      return res.status(404).json({ message: 'Publicación no encontrada' });
    }
    res.json({
      message:
        estado === 'activo'
          ? 'Publicación visible de nuevo'
          : estado === 'oculto'
            ? 'Publicación oculta'
            : 'Publicación eliminada',
      publicacion: rows[0],
    });
  } catch (error) {
    console.error('patchPublicacionEstado:', error);
    res.status(500).json({ message: error.message });
  }
};
