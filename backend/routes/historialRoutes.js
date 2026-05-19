import express from 'express';
import { verifyToken, verifyActiveAccount } from '../middleware/auth.js';
import { getMiHistorial } from '../controllers/historialController.js';

const router = express.Router();

router.get('/mi', verifyToken, verifyActiveAccount, getMiHistorial);

export default router;
