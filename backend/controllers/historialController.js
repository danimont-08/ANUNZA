import { pool } from '../config/database.js';

function extractTextPlano(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (s.startsWith('{')) {
    try { return JSON.parse(s).text || s; } catch { return s; }
  }
  return s;
}

export const getMiHistorial = async (req, res) => {
  const userId = req.userId;
  try {
    // Queries base en paralelo
    const [publicacionesRes, interaccionesRes, historialRes, favoritosRes] = await Promise.all([
      pool.query(
        `SELECT * FROM publicaciones WHERE usuario_id = $1 ORDER BY created_at DESC NULLS LAST`,
        [userId]
      ),
      pool.query(
        `SELECT i.id, i.tipo, i.created_at, i.publicacion_id,
                p.titulo AS publicacion_titulo
         FROM interacciones i
         LEFT JOIN publicaciones p ON p.id = i.publicacion_id
         WHERE i.usuario_id = $1
         ORDER BY i.created_at DESC NULLS LAST LIMIT 200`,
        [userId]
      ),
      pool.query(
        `SELECT * FROM historial WHERE usuario_id = $1 ORDER BY created_at DESC NULLS LAST LIMIT 200`,
        [userId]
      ),
      pool.query(
        `SELECT p.*, f.created_at AS saved_at
         FROM favoritos f
         INNER JOIN publicaciones p ON p.id = f.publicacion_id
         WHERE f.usuario_id = $1
         ORDER BY f.created_at DESC NULLS LAST`,
        [userId]
      ),
    ]);

    // Trabajos
    let trabajos = [];
    try {
      const { rows } = await pool.query(
        `SELECT t.*, p.titulo AS publicacion_titulo
         FROM trabajos t
         LEFT JOIN publicaciones p ON p.id = t.publicacion_id
         WHERE t.trabajador_id = $1 OR t.contratante_id = $1
         ORDER BY t.fecha_inicio DESC NULLS LAST`,
        [userId]
      );
      trabajos = rows;
    } catch {
      trabajos = [];
    }

    // Calificaciones
    let calificaciones = [];
    let promedio = null;
    try {
      const [calRes, avgRes] = await Promise.all([
        pool.query(
          `SELECT * FROM calificaciones WHERE evaluado_id = $1 ORDER BY created_at DESC NULLS LAST`,
          [userId]
        ),
        pool.query(
          `SELECT AVG(puntuacion)::float AS p FROM calificaciones WHERE evaluado_id = $1`,
          [userId]
        ),
      ]);
      calificaciones = calRes.rows;
      promedio = avgRes.rows[0]?.p ?? null;
    } catch {
      calificaciones = [];
      promedio = null;
    }

    res.json({
      publicaciones: publicacionesRes.rows,
      interacciones: interaccionesRes.rows,
      historial: historialRes.rows,
      trabajos,
      calificaciones,
      favoritos: favoritosRes.rows,
      promedio_calificacion: promedio != null ? Number(Number(promedio).toFixed(2)) : null,
    });
  } catch (error) {
    console.error('getMiHistorial:', error);
    res.status(500).json({ message: error.message });
  }
};