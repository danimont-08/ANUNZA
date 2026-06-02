import { pool } from '../config/database.js';
import { User } from '../models/User.js';
import { enrichPublicacionRow, parseImagen } from '../utils/publicacionPayload.js';

const ESTADOS_USUARIO = ['activo', 'suspendido'];
const ESTADOS_PUBLICACION = ['activo', 'oculto', 'eliminado'];

/** GET /api/admin/stats */
export const getStats = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM usuarios) AS usuarios_total,
        (SELECT COUNT(*)::int FROM usuarios WHERE COALESCE(estado, 'activo') = 'activo') AS usuarios_activos,
        (SELECT COUNT(*)::int FROM usuarios WHERE estado = 'suspendido') AS usuarios_suspendidos,
        (SELECT COUNT(*)::int FROM publicaciones WHERE COALESCE(estado, 'activo') = 'activo') AS publicaciones_activas,
        (SELECT COUNT(*)::int FROM publicaciones WHERE estado = 'oculto') AS publicaciones_ocultas,
        (SELECT COUNT(DISTINCT objeto_id)::int FROM reportes WHERE tipo = 'publicacion') AS publicaciones_reportadas,
        (SELECT COUNT(*)::int FROM reportes WHERE estado = 'pendiente') AS reportes_pendientes
    `);
    res.json({ stats: rows[0] });
  } catch (error) {
    console.error('getStats:', error);
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/admin/publicaciones?estado=activo|oculto */
export const listPublicaciones = async (req, res) => {
  try {
    const estado = req.query.estado || 'activo';
    const { rows } = await pool.query(
      `SELECT p.id, p.titulo, p.estado, p.created_at,
              u.nombre AS autor_nombre, u.correo AS autor_correo
       FROM publicaciones p
       INNER JOIN usuarios u ON u.id = p.usuario_id
       WHERE p.estado = $1
       ORDER BY p.created_at DESC
       LIMIT 50`,
      [estado]
    );
    res.json({ publicaciones: rows });
  } catch (error) {
    console.error('listPublicaciones:', error);
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

/** PATCH /api/admin/users/:id/verificado */
export const patchUserVerificado = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await User.toggleVerificado(id);
    if (!updated) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ verificado: updated.verificado, user: updated });
  } catch (error) {
    console.error('patchUserVerificado:', error);
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/admin/users/:id */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT id, nombre, correo, telefono, cedula, foto_perfil, verificado, ciudad,
              rol, estado, descripcion, created_at
       FROM usuarios WHERE id = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ user: rows[0] });
  } catch (error) {
    console.error('getUser:', error);
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/admin/reportes?estado=pendiente|revisado */
export const listReportes = async (req, res) => {
  const estado = req.query.estado === 'revisado' ? 'revisado' : 'pendiente';
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.tipo, r.objeto_id, r.motivo, r.detalles, r.estado, r.created_at,
              u_rep.nombre AS reportante_nombre,
              p.titulo          AS publicacion_titulo,
              p.estado          AS publicacion_estado,
              u_due.nombre      AS autor_nombre,
              u_obj.id          AS usuario_reportado_id,
              u_obj.nombre      AS usuario_reportado_nombre,
              u_obj.estado      AS usuario_reportado_estado,
              msg.contenido     AS mensaje_contenido,
              msg.remitente_id  AS mensaje_remitente_id,
              u_msg.nombre      AS mensaje_remitente_nombre
       FROM reportes r
       LEFT JOIN usuarios u_rep ON u_rep.id = r.reportado_por
       LEFT JOIN publicaciones p   ON r.tipo = 'publicacion' AND p.id = r.objeto_id
       LEFT JOIN usuarios u_due    ON r.tipo = 'publicacion' AND u_due.id = p.usuario_id
       LEFT JOIN usuarios u_obj    ON r.tipo = 'usuario'     AND u_obj.id = r.objeto_id
       LEFT JOIN mensajes msg      ON r.tipo = 'mensaje'     AND msg.id = r.objeto_id
       LEFT JOIN usuarios u_msg    ON r.tipo = 'mensaje'     AND u_msg.id = msg.remitente_id
       WHERE r.estado = $1
       ORDER BY r.created_at DESC
       LIMIT 200`,
      [estado]
    );
    res.json({ reportes: rows });
  } catch (error) {
    console.error('listReportes:', error);
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/admin/users/:id/publicaciones */
export const getUserPublicaciones = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT p.id, p.titulo, p.descripcion, p.precio, p.tipo, p.estado, p.created_at,
              p.imagen,
              cat.nombre AS categoria_nombre,
              (SELECT COUNT(*)::int FROM interacciones WHERE publicacion_id = p.id AND tipo = 'me_gusta') AS likes,
              (SELECT COUNT(*)::int FROM comentarios WHERE publicacion_id = p.id) AS comentarios_count
       FROM publicaciones p
       LEFT JOIN categorias cat ON cat.id = p.categoria_id
       WHERE p.usuario_id = $1
       ORDER BY p.created_at DESC`,
      [id]
    );
    const publicaciones = rows.map(r => ({
      ...r,
      imagen_preview: parseImagen(r.imagen)[0]?.url ?? null,
    }));
    res.json({ publicaciones });
  } catch (error) {
    console.error('getUserPublicaciones:', error);
    res.status(500).json({ message: error.message });
  }
};

/** PATCH /api/admin/reportes/:id/estado — marca el reporte como revisado */
export const marcarReporteRevisado = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(
      `UPDATE reportes SET estado = 'revisado' WHERE id = $1`,
      [id]
    );
    if (!rowCount) return res.status(404).json({ message: 'Reporte no encontrado' });
    res.json({ ok: true });
  } catch (error) {
    console.error('marcarReporteRevisado:', error);
    res.status(500).json({ message: error.message });
  }
};

/** DELETE /api/admin/reportes/:id — descarta (elimina) el reporte */
export const patchReporteEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(`DELETE FROM reportes WHERE id = $1`, [id]);
    if (!rowCount) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    res.json({ message: 'Reporte descartado', reporte: { id } });
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

/** Elimina publicación y registros dependientes (orden respetando FKs). */
async function deletePublicacionPermanentemente(publicacionId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `DELETE FROM calificaciones
       WHERE trabajo_id IN (SELECT id FROM trabajos WHERE publicacion_id = $1)`,
      [publicacionId]
    );
    await client.query(`DELETE FROM trabajos WHERE publicacion_id = $1`, [publicacionId]);
    await client.query(`DELETE FROM comentarios WHERE publicacion_id = $1`, [publicacionId]);
    await client.query(`DELETE FROM interacciones WHERE publicacion_id = $1`, [publicacionId]);
    await client.query(`DELETE FROM reportes WHERE tipo = 'publicacion' AND objeto_id = $1`, [publicacionId]);

    const { rowCount, rows } = await client.query(
      `DELETE FROM publicaciones WHERE id = $1
       RETURNING id, titulo, usuario_id`,
      [publicacionId]
    );

    if (!rowCount) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('COMMIT');
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

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

    if (estado === 'eliminado') {
      const deleted = await deletePublicacionPermanentemente(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Publicación no encontrada' });
      }
      return res.json({
        message: 'Publicación eliminada permanentemente',
        eliminada: true,
        publicacion: { ...deleted, estado: 'eliminado' },
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
        estado === 'activo' ? 'Publicación visible de nuevo' : 'Publicación oculta',
      publicacion: rows[0],
    });
  } catch (error) {
    console.error('patchPublicacionEstado:', error);
    res.status(500).json({ message: error.message });
  }
};
