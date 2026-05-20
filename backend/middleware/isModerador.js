import { pool } from '../config/database.js';

export const isModerador = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT rol FROM usuarios WHERE id = $1`,
      [req.userId]
    );
    if (!rows.length || rows[0].rol !== 'moderador') {
      return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de moderador.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
