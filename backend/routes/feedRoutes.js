import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getFeed,
  getCategorias,
  createPublication,
  toggleLike,
  toggleFavorito,
  deletePublicacion,
  getComentarios,
  addComentario,
  deleteComentario,
  toggleLikeComentario,
} from '../controllers/feedController.js';

const router = express.Router();

router.get('/categorias', verifyToken, getCategorias);
router.post('/publicaciones', verifyToken, createPublication);
router.get('/', verifyToken, getFeed);
router.post('/publicaciones/:publicacionId/like', verifyToken, toggleLike);
router.post('/publicaciones/:publicacionId/favorito', verifyToken, toggleFavorito);
router.delete('/publicaciones/:publicacionId', verifyToken, deletePublicacion);
router.get('/publicaciones/:publicacionId/comentarios', verifyToken, getComentarios);
router.post('/publicaciones/:publicacionId/comentarios', verifyToken, addComentario);
router.delete('/comentarios/:comentarioId', verifyToken, deleteComentario);
router.post('/comentarios/:comentarioId/like', verifyToken, toggleLikeComentario);

export default router;
