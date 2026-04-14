import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getFeed,
  getCategorias,
  createPublication,
  toggleLike,
  getComentarios,
  addComentario,
} from '../controllers/feedController.js';

const router = express.Router();

router.get('/categorias', verifyToken, getCategorias);
router.post('/publicaciones', verifyToken, createPublication);
router.get('/', verifyToken, getFeed);
router.post('/publicaciones/:publicacionId/like', verifyToken, toggleLike);
router.get('/publicaciones/:publicacionId/comentarios', verifyToken, getComentarios);
router.post('/publicaciones/:publicacionId/comentarios', verifyToken, addComentario);

export default router;
