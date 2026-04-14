import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from '../controllers/notificacionesController.js';

const router = Router();
router.use(verifyToken);

router.get('/', getNotificaciones);
router.patch('/leer-todas', marcarTodasLeidas);
router.patch('/:id/leer', marcarLeida);

export default router;

