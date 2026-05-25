import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import {
  getAllUsers,
  getUserProfile,
  getPublicProfile,
  getPublicUserPublicaciones,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';

const router = express.Router();

/**
 * Todas las rutas requieren token JWT
 */

/**
 * GET /api/users
 * Obtener todos los usuarios
 */
router.get('/', verifyToken, verifyAdmin, getAllUsers);

/**
 * GET /api/users/profile
 * Obtener perfil del usuario autenticado
 */
router.get('/profile', verifyToken, getUserProfile);
router.get('/:id/public', verifyToken, getPublicProfile);
router.get('/:id/publicaciones', verifyToken, getPublicUserPublicaciones);

/**
 * PUT /api/users/:id
 * Actualizar usuario
 */
router.put('/:id', verifyToken, updateUser);

/**
 * DELETE /api/users/:id
 * Eliminar usuario
 */
router.delete('/:id', verifyToken, deleteUser);

export default router;
