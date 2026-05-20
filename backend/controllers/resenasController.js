import { pool } from '../config/database.js';

function enrichCalificacionRow(row) {
  const media_items = [];
  if (row.imagen_url) {
    media_items.push({ url: row.imagen_url, type: 'image' });
  }
  if (row.video_url) {
    media_items.push({ url: row.video_url, type: 'video' });
  }
  return {
    ...row,
    contenido: row.comentario ?? row.contenido,
    media_items,
  };
}

async function getPublicacion(publicacionId) {
  const { rows } = await pool.query(
    `SELECT id, usuario_id, titulo FROM publicaciones WHERE id = $1`,
    [publicacionId]
  );
  return rows[0] || null;
}

/** Obtiene o crea un trabajo para enlazar la calificación (sin validar estado). */
async function resolveTrabajoParaResena(publicacionId, evaluadorId, pub) {
  const { rows: prev } = await pool.query(
    `SELECT id FROM trabajos
     WHERE publicacion_id = $1 AND contratante_id = $2
     LIMIT 1`,
    [publicacionId, evaluadorId]
  );
  if (prev.length) {
    return { trabajoId: prev[0].id, evaluadoId: pub.usuario_id };
  }

  const { rows } = await pool.query(
    `INSERT INTO trabajos (publicacion_id, contratante_id, trabajador_id, estado)
     VALUES ($1, $2, $3, 'activo')
     RETURNING id`,
    [publicacionId, evaluadorId, pub.usuario_id]
  );
  return { trabajoId: rows[0].id, evaluadoId: pub.usuario_id };
}

async function yaCalifico(publicacionId, evaluadorId) {
  const { rows } = await pool.query(
    `SELECT c.id FROM calificaciones c
     INNER JOIN trabajos t ON t.id = c.trabajo_id
     WHERE t.publicacion_id = $1 AND c.evaluador_id = $2
     LIMIT 1`,
    [publicacionId, evaluadorId]
  );
  return rows.length > 0;
}

export async function buildResenaEligibility(publicacionId, userId) {
  const pub = await getPublicacion(publicacionId);
  if (!pub) {
    return {
      puede_resenar: false,
      motivo: 'Publicación no encontrada',
      ya_reseno: false,
    };
  }

  if (String(pub.usuario_id) === String(userId)) {
    return {
      puede_resenar: false,
      motivo: 'No puedes reseñar tu propia publicación',
      es_autor: true,
      ya_reseno: false,
    };
  }

  const yaReseno = await yaCalifico(publicacionId, userId);
  if (yaReseno) {
    return {
      puede_resenar: false,
      motivo: 'Ya publicaste una reseña en esta publicación',
      ya_reseno: true,
    };
  }

  return {
    puede_resenar: true,
    motivo: null,
    ya_reseno: false,
  };
}

function extraerMediaUrls(body) {
  let imagen_url = body.imagen_url ? String(body.imagen_url).trim() : null;
  let video_url = body.video_url ? String(body.video_url).trim() : null;

  if (Array.isArray(body.media)) {
    for (const m of body.media) {
      if (!m?.url) continue;
      if (!imagen_url && m.type !== 'video') imagen_url = String(m.url);
      if (!video_url && m.type === 'video') video_url = String(m.url);
    }
  }

  return {
    imagen_url: imagen_url || null,
    video_url: video_url || null,
  };
}

/** GET /api/feed/publicaciones/:publicacionId/resenas/eligibilidad */
export const getResenaEligibilidad = async (req, res) => {
  try {
    const elig = await buildResenaEligibility(req.params.publicacionId, req.userId);
    res.json(elig);
  } catch (error) {
    console.error('getResenaEligibilidad:', error);
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/feed/publicaciones/:publicacionId/resenas */
export const getResenas = async (req, res) => {
  const { publicacionId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.trabajo_id, c.comentario, c.puntuacion, c.imagen_url, c.video_url,
              c.created_at, c.evaluador_id AS usuario_id,
              u.nombre AS autor_nombre, u.foto_perfil AS autor_foto
       FROM calificaciones c
       INNER JOIN trabajos t ON t.id = c.trabajo_id
       INNER JOIN usuarios u ON u.id = c.evaluador_id
       WHERE t.publicacion_id = $1
       ORDER BY c.created_at DESC`,
      [publicacionId]
    );

    const stats = await pool.query(
      `SELECT COUNT(*)::int AS total, COALESCE(AVG(c.puntuacion), 0)::float AS promedio
       FROM calificaciones c
       INNER JOIN trabajos t ON t.id = c.trabajo_id
       WHERE t.publicacion_id = $1`,
      [publicacionId]
    );

    res.json({
      resenas: rows.map(enrichCalificacionRow),
      resenas_count: stats.rows[0]?.total ?? 0,
      promedio_resenas:
        stats.rows[0]?.promedio != null
          ? Number(Number(stats.rows[0].promedio).toFixed(1))
          : null,
    });
  } catch (error) {
    console.error('getResenas:', error);
    res.status(500).json({ message: error.message });
  }
};

/** POST /api/feed/publicaciones/:publicacionId/resenas */
export const addResena = async (req, res) => {
  const userId = req.userId;
  const { publicacionId } = req.params;
  const texto = String(req.body.comentario ?? req.body.contenido ?? '').trim();
  const { imagen_url, video_url } = extraerMediaUrls(req.body);

  if (!texto) {
    return res.status(400).json({ message: 'El comentario de la reseña no puede estar vacío' });
  }

  const stars = parseInt(String(req.body.puntuacion), 10);
  if (Number.isNaN(stars) || stars < 1 || stars > 5) {
    return res.status(400).json({ message: 'La calificación debe ser entre 1 y 5 estrellas' });
  }

  try {
    const pub = await getPublicacion(publicacionId);
    if (!pub) {
      return res.status(404).json({ message: 'Publicación no encontrada' });
    }
    if (String(pub.usuario_id) === String(userId)) {
      return res.status(403).json({ message: 'No puedes reseñar tu propia publicación' });
    }

    const elig = await buildResenaEligibility(publicacionId, userId);
    if (!elig.puede_resenar) {
      return res.status(403).json({ message: elig.motivo || 'No puedes reseñar esta publicación' });
    }
    const resolved = await resolveTrabajoParaResena(publicacionId, userId, pub);
    if (!resolved?.trabajoId || !resolved?.evaluadoId) {
      return res.status(400).json({ message: 'No se pudo registrar la reseña' });
    }

    const { rows } = await pool.query(
      `INSERT INTO calificaciones (
         trabajo_id, evaluador_id, evaluado_id, puntuacion, comentario, imagen_url, video_url
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, trabajo_id, comentario, puntuacion, imagen_url, video_url, created_at, evaluador_id`,
      [
        resolved.trabajoId,
        userId,
        resolved.evaluadoId,
        stars,
        texto,
        imagen_url,
        video_url,
      ]
    );

    const u = await pool.query(
      `SELECT nombre AS autor_nombre, foto_perfil AS autor_foto FROM usuarios WHERE id = $1`,
      [userId]
    );

    try {
      if (pub?.usuario_id && pub.usuario_id !== userId) {
        const nombre = u.rows[0]?.autor_nombre || 'Alguien';
        const titulo = pub.titulo || 'tu servicio';
        await pool.query(
          `INSERT INTO notificaciones (usuario_id, tipo, referencia_id, mensaje)
           VALUES ($1, 'resena', $2, $3)`,
          [pub.usuario_id, publicacionId, `${nombre} dejó una reseña (${stars}/5) en "${titulo}"`]
        );
      }
    } catch { /* no bloquear */ }

    res.status(201).json({
      resena: enrichCalificacionRow({
        ...rows[0],
        usuario_id: userId,
        ...u.rows[0],
      }),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ya publicaste una reseña en esta publicación' });
    }
    console.error('addResena:', error);
    res.status(500).json({ message: error.message });
  }
};
