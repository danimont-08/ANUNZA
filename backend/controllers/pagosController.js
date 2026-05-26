import { pool } from '../config/database.js';

const LIMITE_GRATUITO = 3;
const LIMITE_PREMIUM  = 5;

const PRECIOS = {
  destacar_publicacion: 9900,   // COP por 7 días
  plan_premium:         29900,  // COP por mes
};

/** Devuelve el plan actual y cuántas publicaciones ha creado hoy el usuario. */
export const getMiEstado = async (req, res) => {
  const userId = req.userId;
  try {
    const u = await pool.query(
      `SELECT plan, verificado FROM usuarios WHERE id = $1`,
      [userId]
    );
    const { plan = 'gratuito', verificado = false } = u.rows[0] || {};

    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const cnt = await pool.query(
      `SELECT COUNT(*)::int AS total FROM publicaciones
       WHERE usuario_id = $1 AND created_at >= $2`,
      [userId, hoy.toISOString()]
    );
    const publicaciones_activas = cnt.rows[0]?.total ?? 0;
    const limite = plan === 'premium' ? LIMITE_PREMIUM : LIMITE_GRATUITO;

    res.json({ plan, verificado, publicaciones_activas, limite });
  } catch (error) {
    console.error('getMiEstado:', error);
    res.status(500).json({ message: error.message });
  }
};

/** Destaca una publicación del usuario (pago simulado, 7 días). */
export const destacarPublicacion = async (req, res) => {
  const userId = req.userId;
  const { publicacion_id } = req.body;

  if (!publicacion_id) {
    return res.status(400).json({ message: 'publicacion_id es requerido.' });
  }

  try {
    // Verificar propiedad
    const pub = await pool.query(
      `SELECT id, titulo FROM publicaciones WHERE id = $1 AND usuario_id = $2`,
      [publicacion_id, userId]
    );
    if (!pub.rows.length) {
      return res.status(403).json({ message: 'Publicación no encontrada o no te pertenece.' });
    }

    // Marcar como destacada por 7 días
    const hasta = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      `UPDATE publicaciones SET destacada = true, destacada_hasta = $1 WHERE id = $2`,
      [hasta.toISOString(), publicacion_id]
    );

    // Registrar pago simulado
    await pool.query(
      `INSERT INTO pagos (usuario_id, tipo, referencia_id, monto, descripcion)
       VALUES ($1, 'destacar_publicacion', $2, $3, $4)`,
      [userId, publicacion_id, PRECIOS.destacar_publicacion,
        `Publicación destacada: "${pub.rows[0].titulo}"`]
    );

    res.json({
      ok: true,
      message: '¡Tu publicación estará destacada por 7 días!',
      destacada_hasta: hasta.toISOString(),
    });
  } catch (error) {
    console.error('destacarPublicacion:', error);
    res.status(500).json({ message: error.message });
  }
};

/** Activa plan Premium para el usuario (pago simulado, 30 días). */
export const contratarPremium = async (req, res) => {
  const userId = req.userId;
  try {
    await pool.query(
      `UPDATE usuarios SET plan = 'premium' WHERE id = $1`,
      [userId]
    );

    // Registrar pago simulado
    await pool.query(
      `INSERT INTO pagos (usuario_id, tipo, monto, descripcion)
       VALUES ($1, 'plan_premium', $2, 'Plan Premium activado (30 días)')`,
      [userId, PRECIOS.plan_premium]
    );

    res.json({
      ok: true,
      message: '¡Plan Premium activado! Ahora puedes publicar sin límite.',
      plan: 'premium',
    });
  } catch (error) {
    console.error('contratarPremium:', error);
    res.status(500).json({ message: error.message });
  }
};

/** Historial de pagos del usuario autenticado. */
export const getMisPagos = async (req, res) => {
  const userId = req.userId;
  try {
    const { rows } = await pool.query(
      `SELECT id, tipo, monto, descripcion, created_at
       FROM pagos WHERE usuario_id = $1
       ORDER BY created_at DESC NULLS LAST LIMIT 50`,
      [userId]
    );
    res.json({ pagos: rows });
  } catch (error) {
    console.error('getMisPagos:', error);
    res.status(500).json({ message: error.message });
  }
};
