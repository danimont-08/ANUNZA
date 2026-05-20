import { pool } from '../config/database.js';

async function queryTrabajos(userId) {
  const attempts = [
    `SELECT t.*, p.titulo AS publicacion_titulo
     FROM trabajos t
     LEFT JOIN publicaciones p ON p.id = t.publicacion_id
     WHERE t.prestador_id = $1 OR t.cliente_id = $1
     ORDER BY t.created_at DESC NULLS LAST`,
    `SELECT t.*, p.titulo AS publicacion_titulo
     FROM trabajos t
     LEFT JOIN publicaciones p ON p.id = t.publicacion_id
     WHERE t.usuario_id = $1 OR t.contratante_id = $1
     ORDER BY t.created_at DESC NULLS LAST`,
    `SELECT t.*, p.titulo AS publicacion_titulo
     FROM trabajos t
     LEFT JOIN publicaciones p ON p.id = t.publicacion_id
     WHERE t.usuario_id = $1
     ORDER BY t.created_at DESC NULLS LAST`,
  ];
  for (const sql of attempts) {
    try {
      const { rows } = await pool.query(sql, [userId]);
      return rows;
    } catch (e) {
      /* siguiente variante de columnas */
    }
  }
  return [];
}

async function queryCalificacionesStats(userId) {
  const listAttempts = [
    `SELECT * FROM calificaciones WHERE evaluado_id = $1 ORDER BY created_at DESC NULLS LAST`,
    `SELECT * FROM calificaciones WHERE usuario_id = $1 ORDER BY created_at DESC NULLS LAST`,
  ];
  let rows = [];
  for (const sql of listAttempts) {
    try {
      const r = await pool.query(sql, [userId]);
      rows = r.rows;
      break;
    } catch (e) {
      /* */
    }
  }

  let promedio = null;
  const avgAttempts = [
    `SELECT AVG(puntuacion)::float AS p FROM calificaciones WHERE evaluado_id = $1`,
    `SELECT AVG(puntuacion)::float AS p FROM calificaciones WHERE usuario_id = $1`,
    `SELECT AVG(puntuacion)::float AS p FROM calificaciones WHERE calificado_id = $1`,
  ];
  for (const sql of avgAttempts) {
    try {
      const r = await pool.query(sql, [userId]);
      promedio = r.rows[0]?.p ?? null;
      break;
    } catch (e) {
      /* */
    }
  }

  return { lista: rows, promedio };
}

/**
 * Resumen de historial del usuario autenticado.
 */
export const getMiHistorial = async (req, res) => {
  const userId = req.userId;
  try {
    const [publicaciones, interacciones, historialRows, trabajos, cal, favoritos] = await Promise.all([
      pool
        .query(
          `SELECT * FROM publicaciones WHERE usuario_id = $1 ORDER BY created_at DESC NULLS LAST`,
          [userId]
        )
        .then((r) => r.rows),
      pool
        .query(
          `SELECT * FROM interacciones WHERE usuario_id = $1 ORDER BY created_at DESC NULLS LAST LIMIT 200`,
          [userId]
        )
        .then((r) => r.rows),
      pool
        .query(
          `SELECT * FROM historial WHERE usuario_id = $1 ORDER BY created_at DESC NULLS LAST LIMIT 200`,
          [userId]
        )
        .then((r) => r.rows),
      queryTrabajos(userId),
      queryCalificacionesStats(userId),
      pool
        .query(
          `SELECT p.*, f.created_at AS saved_at
           FROM favoritos f
           INNER JOIN publicaciones p ON p.id = f.publicacion_id
           WHERE f.usuario_id = $1
           ORDER BY f.created_at DESC NULLS LAST`,
          [userId]
        )
        .then((r) => r.rows),
    ]);

    res.json({
      publicaciones,
      interacciones,
      historial: historialRows,
      trabajos,
      calificaciones: cal.lista,
      favoritos,
      promedio_calificacion: cal.promedio != null ? Number(Number(cal.promedio).toFixed(2)) : null,
    });
  } catch (error) {
    console.error('getMiHistorial:', error);
    res.status(500).json({ message: error.message });
  }
};
