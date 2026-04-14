import { pool } from '../config/database.js';

/**
 * Parsea la descripción que puede ser texto plano o JSON {"text":"..."}.
 */
function extractTextPlano(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (s.startsWith('{')) {
    try { return JSON.parse(s).text || s; } catch { return s; }
  }
  return s;
}

/**
 * Resumen de historial del usuario autenticado.
 * Se ejecutan en paralelo con Promise.all (seguro con max:10 en Transaction Pooler).
 */
export const getMiHistorial = async (req, res) => {
  const userId = req.userId;
  try {
    // Queries base en paralelo (no dependen entre sí)
    const [publicacionesRes, interaccionesRes, historialRes] = await Promise.all([
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
    ]);

    // Trabajos: columnas reales del schema (trabajador_id / contratante_id)
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

    // Calificaciones en paralelo: lista + promedio al mismo tiempo
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
      promedio_calificacion: promedio != null ? Number(Number(promedio).toFixed(2)) : null,
    });
  } catch (error) {
    console.error('getMiHistorial:', error);
    res.status(500).json({ message: error.message });
  }
};
