import express from 'express';
import { verifyToken, verifyActiveAccount } from '../middleware/auth.js';
import {
  getFeed,
  getCategorias,
  getPublicacionById,
  createPublication,
  updatePublication,
  deletePublication,
  toggleLike,
  toggleGuardar,
  getComentarios,
  addComentario,
  toggleComentarioLike,
} from '../controllers/feedController.js';
import {
  getResenas,
  addResena,
  getResenaEligibilidad,
} from '../controllers/resenasController.js';

const router = express.Router();

router.get('/categorias', verifyToken, verifyActiveAccount, getCategorias);
router.post('/publicaciones', verifyToken, verifyActiveAccount, createPublication);
router.get('/', verifyToken, verifyActiveAccount, getFeed);
router.post('/publicaciones/:publicacionId/like', verifyToken, verifyActiveAccount, toggleLike);
router.post('/publicaciones/:publicacionId/guardar', verifyToken, verifyActiveAccount, toggleGuardar);
router.get('/publicaciones/:publicacionId', verifyToken, verifyActiveAccount, getPublicacionById);
router.put('/publicaciones/:publicacionId', verifyToken, verifyActiveAccount, updatePublication);
router.delete('/publicaciones/:publicacionId', verifyToken, verifyActiveAccount, deletePublication);
router.get('/publicaciones/:publicacionId/comentarios', verifyToken, verifyActiveAccount, getComentarios);
router.post('/publicaciones/:publicacionId/comentarios', verifyToken, verifyActiveAccount, addComentario);
router.post('/comentarios/:comentarioId/like', verifyToken, verifyActiveAccount, toggleComentarioLike);
router.get('/publicaciones/:publicacionId/resenas/eligibilidad', verifyToken, verifyActiveAccount, getResenaEligibilidad);
router.get('/publicaciones/:publicacionId/resenas', verifyToken, verifyActiveAccount, getResenas);
router.post('/publicaciones/:publicacionId/resenas', verifyToken, verifyActiveAccount, addResena);

export default router;
