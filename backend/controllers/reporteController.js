import { pool } from '../config/database.js';

const TIPOS_VALIDOS = ['publicacion', 'usuario', 'mensaje'];

export const createReporte = async (req, res) => {
  const reportadoPor = req.userId;
  const { tipo, objeto_id, motivo, detalles } = req.body;

  if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ message: 'Tipo de reporte inválido' });
  }
  if (!objeto_id) {
    return res.status(400).json({ message: 'Falta el ID del objeto reportado' });
  }
  if (!motivo || !String(motivo).trim()) {
    return res.status(400).json({ message: 'El motivo es obligatorio' });
  }

  try {
    await pool.query(
      `INSERT INTO reportes (tipo, objeto_id, reportado_por, motivo, detalles)
       VALUES ($1, $2, $3, $4, $5)`,
      [tipo, objeto_id, reportadoPor, String(motivo).trim(), detalles ? String(detalles).trim() : null]
    );
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error('createReporte:', error);
    res.status(500).json({ message: error.message });
  }
};
