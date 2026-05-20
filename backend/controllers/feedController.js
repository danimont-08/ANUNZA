import { pool } from '../config/database.js';
import {
  enrichPublicacionRow,
  serializeDescripcion,
  serializeMediaItems,
} from '../utils/publicacionPayload.js';

/**
 * FEED CON FILTROS OPCIONALES
 */
export const getFeed = async (req, res) => {
  const userId = req.userId;
  
  let categoriaId = null;
  if (req.query.categoria_id != null && req.query.categoria_id !== '') {
    const n = parseInt(String(req.query.categoria_id), 10);
    if (Number.isNaN(n)) {
      return res.status(400).json({ message: 'categoria_id inválido' });
    }
    categoriaId = n;
  }

  let subcategoriaId = null;
  if (req.query.subcategoria_id != null && req.query.subcategoria_id !== '') {
    const n = parseInt(String(req.query.subcategoria_id), 10);
    if (Number.isNaN(n)) {
      return res.status(400).json({ message: 'subcategoria_id inválido' });
    }
    subcategoriaId = n;
  }

  const ciudad =
    req.query.ciudad != null && String(req.query.ciudad).trim()
      ? String(req.query.ciudad).trim()
      : null;

  let precioMin = null;
  if (req.query.precio_min != null && req.query.precio_min !== '') {
    const n = parseFloat(String(req.query.precio_min));
    if (Number.isNaN(n)) {
      return res.status(400).json({ message: 'precio_min inválido' });
    }
    precioMin = n;
  }

  let precioMax = null;
  if (req.query.precio_max != null && req.query.precio_max !== '') {
    const n = parseFloat(String(req.query.precio_max));
    if (Number.isNaN(n)) {
      return res.status(400).json({ message: 'precio_max inválido' });
    }
    precioMax = n;
  }

  let calificacionMin = null;
  if (req.query.calificacion_min != null && req.query.calificacion_min !== '') {
    const n = parseFloat(String(req.query.calificacion_min));
    if (Number.isNaN(n) || n < 1 || n > 5) {
      return res.status(400).json({ message: 'calificacion_min debe estar entre 1 y 5' });
    }
    calificacionMin = n;
  }

try {
    const { rows } = await pool.query(
      `SELECT p.id,
          p.titulo,
          p.descripcion,
          p.imagen,
          p.precio,
          p.tipo,
          p.estado,
          p.created_at,
          p.usuario_id,
          p.categoria_id,
          p.subcategoria_id,
          u.nombre AS autor_nombre,
          u.foto_perfil AS autor_foto,
          u.ciudad AS autor_ciudad,
          cat.nombre AS categoria_nombre,
          subcat.nombre AS subcategoria_nombre,
          COALESCE(ic.cnt, 0)::int AS interacciones_count,
          COALESCE(cc.cnt, 0)::int AS comentarios_count,
          COALESCE(rc.cnt, 0)::int AS resenas_count,
          COALESCE(rc.prom, 0)::float AS promedio_resenas,
          COALESCE(rc.prom, 0)::float AS calificacion_promedio,
          EXISTS (
            SELECT 1 FROM interacciones i2
            WHERE i2.publicacion_id = p.id
              AND i2.usuario_id = $1
              AND i2.tipo IN ('me_gusta', 'like')
          ) AS user_liked
        FROM publicaciones p
        INNER JOIN usuarios u ON u.id = p.usuario_id
        LEFT JOIN categorias cat ON cat.id = p.categoria_id
        LEFT JOIN subcategorias subcat ON subcat.id = p.subcategoria_id
        LEFT JOIN (
          SELECT publicacion_id, COUNT(*)::int AS cnt
          FROM interacciones
          WHERE tipo IN ('me_gusta', 'like')
          GROUP BY publicacion_id
        ) ic ON ic.publicacion_id = p.id
        LEFT JOIN (
          SELECT publicacion_id, COUNT(*)::int AS cnt
          FROM comentarios
          GROUP BY publicacion_id
        ) cc ON cc.publicacion_id = p.id
        LEFT JOIN (
          SELECT t.publicacion_id,
                 COUNT(*)::int AS cnt,
                 ROUND(AVG(c.puntuacion)::numeric, 1) AS prom
          FROM calificaciones c
          INNER JOIN trabajos t ON t.id = c.trabajo_id
          GROUP BY t.publicacion_id
        ) rc ON rc.publicacion_id = p.id
        WHERE COALESCE(p.estado, 'activo') = 'activo'
          AND ($2::integer IS NULL OR p.categoria_id = $2)
          AND ($3::integer IS NULL OR p.subcategoria_id = $3)
          AND ($4::text IS NULL OR TRIM(COALESCE(u.ciudad, '')) ILIKE '%' || $4 || '%')
          AND ($5::numeric IS NULL OR p.precio >= $5)
          AND ($6::numeric IS NULL OR p.precio <= $6)
          AND ($7::float IS NULL OR COALESCE(rc.prom, 0) >= $7)
        ORDER BY p.created_at DESC NULLS LAST
        LIMIT 80`,
      [userId, categoriaId, subcategoriaId, ciudad, precioMin, precioMax, calificacionMin]
    );

    res.json({
      publicaciones: rows.map((r) => {
        const pub = enrichPublicacionRow(r);
        return {
          ...pub,
          resenas_count: r.resenas_count ?? 0,
          promedio_resenas:
            r.promedio_resenas != null ? Number(r.promedio_resenas) : null,
        };
      }),
    });
  } catch (error) {
    console.error('getFeed:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getCategorias = async (req, res) => {
  try {
    const { rows: categorias } = await pool.query(
      `SELECT id, nombre FROM categorias ORDER BY nombre ASC`
    );

    const { rows: subcategorias } = await pool.query(
      `SELECT id, categoria_id, nombre FROM subcategorias ORDER BY categoria_id, nombre ASC`
    );

    // Agrupar subcategorías por categoría
    const categoriasConSubcat = categorias.map((cat) => ({
      ...cat,
      subcategorias: subcategorias.filter((sub) => sub.categoria_id === cat.id),
    }));

    res.json({ categorias: categoriasConSubcat, subcategorias });
  } catch (error) {
    console.error('getCategorias:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createPublication = async (req, res) => {
  const userId = req.userId;
  try {
    const {
      titulo,
      descripcion: descInput,
      categoria_id,
      tipo = 'ofrezco',
      agregar_servicio,
      precio,
      service,
      hashtags,
      media,
    } = req.body;

    const catId = parseInt(String(categoria_id), 10);
    if (Number.isNaN(catId) || catId < 1) {
      return res.status(400).json({ message: 'Categoría inválida' });
    }

    const catCheck = await pool.query(`SELECT id FROM categorias WHERE id = $1`, [catId]);
    if (!catCheck.rows.length) {
      return res.status(400).json({ message: 'La categoría no existe' });
    }

    const text = String(descInput || '').trim();
    if (!text) {
      return res.status(400).json({ message: 'La descripción es obligatoria' });
    }

    const tags = Array.isArray(hashtags) ? hashtags : [];
    const useService = !!agregar_servicio;
    const descripcionStored =
      useService || tags.length
        ? serializeDescripcion({
            text,
            hashtags: tags,
            service: useService ? service || {} : null,
          })
        : text;

    let precioVal = null;
    if (useService && precio != null && precio !== '') {
      const n = Number(precio);
      if (!Number.isNaN(n)) precioVal = n;
    }

    const tituloVal = String(titulo || '').trim() || text.slice(0, 120) || 'Publicación';
    const tipoVal = tipo === 'busco' ? 'busco' : 'ofrezco';
    const imagenVal = serializeMediaItems(media);

    const { rows } = await pool.query(
      `INSERT INTO publicaciones (usuario_id, categoria_id, titulo, descripcion, tipo, precio, imagen, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'activo')
       RETURNING *`,
      [userId, catId, tituloVal, descripcionStored, tipoVal, precioVal, imagenVal]
    );

    const row = rows[0];
    const u = await pool.query(
      `SELECT nombre AS autor_nombre, foto_perfil AS autor_foto, ciudad AS autor_ciudad
       FROM usuarios WHERE id = $1`,
      [userId]
    );
    const cat = await pool.query(`SELECT nombre AS categoria_nombre FROM categorias WHERE id = $1`, [catId]);

    const merged = {
      ...row,
      ...u.rows[0],
      categoria_nombre: cat.rows[0]?.categoria_nombre || null,
      interacciones_count: 0,
      comentarios_count: 0,
      user_liked: false,
    };

    res.status(201).json({ publicacion: enrichPublicacionRow(merged) });
  } catch (error) {
    console.error('createPublication:', error);
    res.status(500).json({ message: error.message });
  }
};

export const toggleLike = async (req, res) => {
  const userId = req.userId;
  const { publicacionId } = req.params;

  try {
    const existing = await pool.query(
      `SELECT id, tipo FROM interacciones
       WHERE usuario_id = $1 AND publicacion_id = $2 AND tipo IN ('me_gusta', 'like')`,
      [userId, publicacionId]
    );

    if (existing.rows.length > 0) {
      await pool.query(`DELETE FROM interacciones WHERE id = $1`, [existing.rows[0].id]);
      const count = await pool.query(
        `SELECT COUNT(*)::int AS c FROM interacciones WHERE publicacion_id = $1 AND tipo IN ('me_gusta', 'like')`,
        [publicacionId]
      );
      return res.json({ liked: false, interacciones_count: count.rows[0].c });
    }

    await pool.query(
      `INSERT INTO interacciones (usuario_id, publicacion_id, tipo)
       VALUES ($1, $2, 'me_gusta')`,
      [userId, publicacionId]
    );
    const count = await pool.query(
      `SELECT COUNT(*)::int AS c FROM interacciones WHERE publicacion_id = $1 AND tipo IN ('me_gusta', 'like')`,
      [publicacionId]
    );
    // Notificar al dueño de la publicación (si es diferente al que da like)
    try {
      const pub = await pool.query(`SELECT usuario_id, titulo FROM publicaciones WHERE id = $1`, [publicacionId]);
      const owner = pub.rows[0];
      if (owner && owner.usuario_id !== userId) {
        const liker = await pool.query(`SELECT nombre FROM usuarios WHERE id = $1`, [userId]);
        const nombre = liker.rows[0]?.nombre || 'Alguien';
        const titulo = owner.titulo || 'tu publicación';
        await pool.query(
          `INSERT INTO notificaciones (usuario_id, tipo, referencia_id, mensaje)
           VALUES ($1, 'me_gusta', $2, $3)`,
          [owner.usuario_id, publicacionId, `${nombre} le dio me gusta a "${titulo}"`]
        );
      }
    } catch { /* no fallar la respuesta por la notificación */ }
    res.json({ liked: true, interacciones_count: count.rows[0].c });
  } catch (error) {
    console.error('toggleLike:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getComentarios = async (req, res) => {
  const { publicacionId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.contenido, c.created_at, c.usuario_id,
              u.nombre AS autor_nombre, u.foto_perfil AS autor_foto
       FROM comentarios c
       INNER JOIN usuarios u ON u.id = c.usuario_id
       WHERE c.publicacion_id = $1
       ORDER BY c.created_at ASC`,
      [publicacionId]
    );
    res.json({ comentarios: rows });
  } catch (error) {
    console.error('getComentarios:', error);
    res.status(500).json({ message: error.message });
  }
};

export const addComentario = async (req, res) => {
  const userId = req.userId;
  const { publicacionId } = req.params;
  const { contenido } = req.body;

  if (!contenido || !String(contenido).trim()) {
    return res.status(400).json({ message: 'El comentario no puede estar vacío' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO comentarios (usuario_id, publicacion_id, contenido)
       VALUES ($1, $2, $3)
       RETURNING id, contenido, created_at, usuario_id, publicacion_id`,
      [userId, publicacionId, String(contenido).trim()]
    );

    const u = await pool.query(
      `SELECT nombre AS autor_nombre, foto_perfil AS autor_foto FROM usuarios WHERE id = $1`,
      [userId]
    );

    // Notificar al dueño de la publicación
    try {
      const pub = await pool.query(`SELECT usuario_id, titulo FROM publicaciones WHERE id = $1`, [publicacionId]);
      const owner = pub.rows[0];
      if (owner && owner.usuario_id !== userId) {
        const nombre = u.rows[0]?.autor_nombre || 'Alguien';
        const titulo = owner.titulo || 'tu publicación';
        await pool.query(
          `INSERT INTO notificaciones (usuario_id, tipo, referencia_id, mensaje)
           VALUES ($1, 'comentario', $2, $3)`,
          [owner.usuario_id, publicacionId, `${nombre} comentó en "${titulo}"`]
        );
      }
    } catch { /* no fallar la respuesta por la notificación */ }

    res.status(201).json({
      comentario: { ...rows[0], ...u.rows[0] },
    });
  } catch (error) {
    console.error('addComentario:', error);
    res.status(500).json({ message: error.message });
  }
};
