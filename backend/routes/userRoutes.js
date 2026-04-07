import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getAllUsers,
  getUserProfile,
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
router.get('/', verifyToken, getAllUsers);

/**
 * GET /api/users/profile
 * Obtener perfil del usuario autenticado
 */
router.get('/profile', verifyToken, getUserProfile);

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
