import { pool } from '../config/database.js';

const MOTIVOS_VALIDOS = ['spam', 'inapropiado', 'fraude', 'acoso', 'otro'];
const TIPOS_VALIDOS   = ['publicacion', 'usuario', 'mensaje'];

/** Crea un reporte sobre una publicación, usuario o mensaje. */
export const crearReporte = async (req, res) => {
  const userId = req.userId;
  const { tipo, motivo, detalles, publicacion_id, usuario_id, mensaje_id } = req.body;

  // Determinar el objeto_id según el tipo enviado por el cliente
  const tipoNorm = String(tipo || 'publicacion').toLowerCase();
  let objeto_id;
  if (tipoNorm === 'publicacion') objeto_id = publicacion_id;
  else if (tipoNorm === 'usuario')    objeto_id = usuario_id;
  else if (tipoNorm === 'mensaje')    objeto_id = mensaje_id;

  if (!TIPOS_VALIDOS.includes(tipoNorm)) {
    return res.status(400).json({ message: `Tipo inválido. Opciones: ${TIPOS_VALIDOS.join(', ')}` });
  }
  if (!objeto_id) {
    return res.status(400).json({ message: `${tipoNorm}_id es requerido` });
  }
  if (!motivo || !MOTIVOS_VALIDOS.includes(String(motivo).toLowerCase())) {
    return res.status(400).json({
      message: `Motivo inválido. Opciones: ${MOTIVOS_VALIDOS.join(', ')}`,
    });
  }

  try {
    // Verificar existencia del objeto reportado
    if (tipoNorm === 'publicacion') {
      const { rows } = await pool.query(`SELECT id FROM publicaciones WHERE id = $1`, [objeto_id]);
      if (!rows.length) return res.status(404).json({ message: 'Publicación no encontrada' });
    } else if (tipoNorm === 'usuario') {
      const { rows } = await pool.query(`SELECT id FROM usuarios WHERE id = $1`, [objeto_id]);
      if (!rows.length) return res.status(404).json({ message: 'Usuario no encontrado' });
    } else if (tipoNorm === 'mensaje') {
      const { rows } = await pool.query(`SELECT id FROM mensajes WHERE id = $1`, [objeto_id]);
      if (!rows.length) return res.status(404).json({ message: 'Mensaje no encontrado' });
    }

    await pool.query(
      `INSERT INTO reportes (tipo, objeto_id, reportado_por, motivo, detalles)
       VALUES ($1, $2, $3, $4, $5)`,
      [tipoNorm, objeto_id, userId, String(motivo).toLowerCase(), detalles ? String(detalles).trim() : null]
    );

    res.status(201).json({ ok: true, message: 'Reporte enviado. Gracias por contribuir a la comunidad.' });
  } catch (error) {
    console.error('crearReporte:', error);
    res.status(500).json({ message: error.message });
  }
};
