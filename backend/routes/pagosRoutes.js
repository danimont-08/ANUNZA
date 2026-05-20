import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getMiEstado,
  destacarPublicacion,
  contratarPremium,
  getMisPagos,
} from '../controllers/pagosController.js';

const router = Router();
router.use(verifyToken);

router.get('/estado',   getMiEstado);
router.get('/historial', getMisPagos);
router.post('/destacar', destacarPublicacion);
router.post('/premium',  contratarPremium);

export default router;
