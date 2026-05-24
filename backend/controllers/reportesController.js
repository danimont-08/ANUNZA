import { pool } from '../config/database.js';

const TIPOS_VALIDOS = ['publicacion', 'usuario', 'mensaje'];
const MOTIVOS_VALIDOS = ['spam', 'inapropiado', 'fraude', 'acoso', 'otro'];

export const createReporte = async (req, res) => {
  const reportadoPor = req.userId;
  const { tipo, objeto_id, motivo, detalles } = req.body;

  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ message: 'Tipo de reporte inválido' });
  }
  if (!objeto_id) {
    return res.status(400).json({ message: 'Falta el ID del objeto reportado' });
  }
  if (!motivo || !MOTIVOS_VALIDOS.includes(String(motivo).toLowerCase())) {
    return res.status(400).json({
      message: `Motivo inválido. Opciones: ${MOTIVOS_VALIDOS.join(', ')}`,
    });
  }

  try {
    // Verificar que el objeto reportado existe según su tipo
    const tablas = { publicacion: 'publicaciones', usuario: 'usuarios', mensaje: 'mensajes' };
    const tabla = tablas[tipo];
    const existe = await pool.query(`SELECT id FROM ${tabla} WHERE id = $1`, [objeto_id]);
    if (!existe.rows.length) {
      return res.status(404).json({ message: `${tipo} no encontrado` });
    }

    await pool.query(
      `INSERT INTO reportes (tipo, objeto_id, reportado_por, motivo, detalles)
       VALUES ($1, $2, $3, $4, $5)`,
      [tipo, objeto_id, reportadoPor, String(motivo).toLowerCase(), detalles ? String(detalles).trim() : null]
    );

    res.status(201).json({ ok: true, message: 'Reporte enviado. Gracias por contribuir a la comunidad.' });
  } catch (error) {
    console.error('createReporte:', error);
    res.status(500).json({ message: error.message });
  }
};