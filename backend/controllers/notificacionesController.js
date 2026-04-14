import { pool } from '../config/database.js';

/** Lista las notificaciones del usuario autenticado (no leídas primero, máx. 50). */
export const getNotificaciones = async (req, res) => {
  const userId = req.userId;
  try {
    const { rows } = await pool.query(
      `SELECT id, tipo, referencia_id, mensaje, leida, created_at
       FROM notificaciones
       WHERE usuario_id = $1
       ORDER BY leida ASC, created_at DESC NULLS LAST
       LIMIT 50`,
      [userId]
    );
    const noLeidas = rows.filter((n) => !n.leida).length;
    res.json({ notificaciones: rows, no_leidas: noLeidas });
  } catch (error) {
    console.error('getNotificaciones:', error);
    res.status(500).json({ message: error.message });
  }
};

/** Marca una notificación concreta como leída. */
export const marcarLeida = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE notificaciones SET leida = true
       WHERE id = $1 AND usuario_id = $2`,
      [id, userId]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('marcarLeida:', error);
    res.status(500).json({ message: error.message });
  }
};

/** Marca todas las notificaciones del usuario como leídas. */
export const marcarTodasLeidas = async (req, res) => {
  const userId = req.userId;
  try {
    await pool.query(
      `UPDATE notificaciones SET leida = true WHERE usuario_id = $1`,
      [userId]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('marcarTodasLeidas:', error);
    res.status(500).json({ message: error.message });
  }
};
