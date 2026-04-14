import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { crearReporte } from '../controllers/reportesController.js';

const router = Router();
router.use(verifyToken);

router.post('/', crearReporte);

export default router;

