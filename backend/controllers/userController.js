import { User } from '../models/User.js';
import { pool } from '../config/database.js';
import { parseImagen } from '../utils/publicacionPayload.js';

/**
 * Obtener todos los usuarios
 * GET /api/users
 * Requiere autenticación
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({
      message: 'Usuarios obtenidos exitosamente',
      users,
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Obtener perfil del usuario autenticado
 * GET /api/users/profile
 * Requiere autenticación
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.estado === 'suspendido' && user.rol !== 'admin') {
      return res.status(403).json({
        message: 'Tu cuenta está suspendida. Contacta al administrador.',
      });
    }

    // No devolvemos la contraseña
    const { password, ...userWithoutPassword } = user;

    res.json({
      message: 'Perfil obtenido exitosamente',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/users/:id/public — perfil público de cualquier usuario */
export const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.foto_perfil, u.foto_portada, u.foto_portada_pos, u.ciudad, u.descripcion, u.verificado,
              u.created_at,
              (SELECT COUNT(*)::int FROM publicaciones p
               WHERE p.usuario_id = u.id AND COALESCE(p.estado,'activo') = 'activo') AS total_publicaciones,
              (SELECT COALESCE(SUM(sub.likes),0)::int
               FROM (SELECT COUNT(*) AS likes FROM interacciones i
                     INNER JOIN publicaciones p ON p.id = i.publicacion_id
                     WHERE p.usuario_id = u.id AND i.tipo = 'me_gusta') sub) AS total_likes
       FROM usuarios u
       WHERE u.id = $1 AND COALESCE(u.estado,'activo') = 'activo'`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ user: rows[0] });
  } catch (error) {
    console.error('getPublicProfile:', error);
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/users/:id/publicaciones — publicaciones activas de un usuario */
export const getPublicUserPublicaciones = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT p.id, p.titulo, p.descripcion, p.precio, p.tipo, p.created_at,
              p.imagen,
              cat.nombre AS categoria_nombre,
              (SELECT COUNT(*)::int FROM interacciones WHERE publicacion_id = p.id AND tipo = 'me_gusta') AS likes,
              (SELECT COUNT(*)::int FROM comentarios WHERE publicacion_id = p.id) AS comentarios_count
       FROM publicaciones p
       LEFT JOIN categorias cat ON cat.id = p.categoria_id
       WHERE p.usuario_id = $1 AND COALESCE(p.estado,'activo') = 'activo'
       ORDER BY p.created_at DESC`,
      [id]
    );
    const publicaciones = rows.map(r => ({
      ...r,
      imagen_preview: parseImagen(r.imagen)[0]?.url ?? null,
    }));
    res.json({ publicaciones });
  } catch (error) {
    console.error('getPublicUserPublicaciones:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Actualizar usuario
 * PUT /api/users/:id
 * Requiere autenticación
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      correo,
      telefono,
      descripcion,
      foto_perfil,
      foto_portada,
      foto_portada_pos,
      ciudad,
      codigo_postal,
      latitud,
      longitud,
    } = req.body;

    // Validar que el usuario solo pueda actualizar su propio perfil
    if (String(id) !== String(req.userId)) {
      return res.status(403).json({ message: 'No tienes permisos para actualizar este usuario' });
    }

    // Validar campos obligatorios de contacto
    if (!nombre || !correo || !telefono) {
      return res.status(400).json({ message: 'Nombre, correo y teléfono son requeridos' });
    }

    // Validar correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ message: 'Correo inválido' });
    }

    // Actualizar usuario
    const success = await User.update(id, {
      nombre,
      correo,
      telefono,
      descripcion,
      foto_perfil,
      foto_portada,
      foto_portada_pos,
      ciudad,
      codigo_postal,
      latitud,
      longitud,
    });
    if (!success) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const updatedUser = await User.findById(id);
    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      message: 'Usuario actualizado exitosamente',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Eliminar usuario
 * DELETE /api/users/:id
 * Requiere autenticación
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el usuario solo pueda eliminar su propio usuario
    if (String(id) !== String(req.userId)) {
      return res.status(403).json({ message: 'No tienes permisos para eliminar este usuario' });
    }

    // Eliminar usuario
    const success = await User.delete(id);
    if (!success) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: error.message });
  }
};
