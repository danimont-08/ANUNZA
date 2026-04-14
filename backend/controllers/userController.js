import { User } from '../models/User.js';

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
