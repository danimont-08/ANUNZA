import express from 'express';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

/**
 * Ruta POST /api/auth/register
 * Registrar nuevo usuario
 */
router.post('/register', register);

/**
 * Ruta POST /api/auth/login
 * Login de usuario
 */
router.post('/login', login);

export default router;
