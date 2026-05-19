import { Router } from 'express';
import { verifyToken, verifyActiveAccount } from '../middleware/auth.js';
import { crearReporte } from '../controllers/reportesController.js';

const router = Router();
router.use(verifyToken, verifyActiveAccount);

router.post('/', crearReporte);

export default router;

