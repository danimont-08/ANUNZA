import { Router } from 'express';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import {
  getStats,
  listUsers,
  patchUserEstado,
  listReportes,
  patchReporteEstado,
  marcarReporteRevisado,
  getPublicacionDetalle,
  patchPublicacionEstado,
} from '../controllers/adminController.js';

const router = Router();

router.use(verifyToken, verifyAdmin);

router.get('/stats', getStats);
router.get('/users', listUsers);
router.patch('/users/:id/estado', patchUserEstado);
router.get('/reportes', listReportes);
router.patch('/reportes/:id/estado', marcarReporteRevisado);
router.delete('/reportes/:id', patchReporteEstado);
router.get('/publicaciones/:id', getPublicacionDetalle);
router.patch('/publicaciones/:id', patchPublicacionEstado);

export default router;
