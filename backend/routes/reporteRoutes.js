import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { createReporte } from '../controllers/reporteController.js';

const router = express.Router();

router.post('/', verifyToken, createReporte);

export default router;
