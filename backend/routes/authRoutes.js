import express from 'express';
import { register, login, confirmarCorreo, reenviarConfirmacion } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/confirmar-correo', confirmarCorreo);
router.post('/reenviar-confirmacion', reenviarConfirmacion);

export default router;
