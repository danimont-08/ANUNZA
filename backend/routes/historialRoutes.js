import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getMiHistorial } from '../controllers/historialController.js';

const router = express.Router();

router.get('/mi', verifyToken, getMiHistorial);

export default router;
