import { Router } from 'express';
import { verifyToken, verifyActiveAccount } from '../middleware/auth.js';
import { createReporte } from '../controllers/reportesController.js';

const router = Router();
router.use(verifyToken, verifyActiveAccount);

router.post('/', createReporte);

export default router;

