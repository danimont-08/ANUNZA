import { pool } from '../config/database.js';

const MOTIVOS_VALIDOS = ['spam', 'inapropiado', 'fraude', 'acoso', 'otro'];

/** Crea un reporte sobre una publicación. */
export const crearReporte = async (req, res) => {
  const userId = req.userId;
  const { publicacion_id, motivo, descripcion } = req.body;

  if (!publicacion_id) {
    return res.status(400).json({ message: 'publicacion_id es requerido' });
  }
  if (!motivo || !MOTIVOS_VALIDOS.includes(String(motivo).toLowerCase())) {
    return res.status(400).json({
      message: `Motivo inválido. Opciones: ${MOTIVOS_VALIDOS.join(', ')}`,
    });
  }

  try {
    // Verificar que la publicación existe
    const pub = await pool.query(`SELECT id FROM publicaciones WHERE id = $1`, [publicacion_id]);
    if (!pub.rows.length) {
      return res.status(404).json({ message: 'Publicación no encontrada' });
    }

    await pool.query(
      `INSERT INTO reportes (publicacion_id, usuario_id, motivo, descripcion)
       VALUES ($1, $2, $3, $4)`,
      [publicacion_id, userId, String(motivo).toLowerCase(), descripcion ? String(descripcion).trim() : null]
    );

    res.status(201).json({ ok: true, message: 'Reporte enviado. Gracias por contribuir a la comunidad.' });
  } catch (error) {
    console.error('crearReporte:', error);
    res.status(500).json({ message: error.message });
  }
};
