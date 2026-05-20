import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  listConversations,
  getOrCreateConversation,
  listMessages,
  sendMessage,
} from '../controllers/chatController.js';
import {
  bloquearUsuario,
  desbloquearUsuario,
  obtenerBloqueados,
  verificarBloqueo,
} from '../controllers/bloqueosController.js';

const router = express.Router();

// Chat routes
router.get('/conversaciones', verifyToken, listConversations);
router.post('/conversaciones', verifyToken, getOrCreateConversation);
router.get('/conversaciones/:conversacionId/mensajes', verifyToken, listMessages);
router.post('/conversaciones/:conversacionId/mensajes', verifyToken, sendMessage);

// Bloqueos routes
router.post('/bloqueos', verifyToken, bloquearUsuario);
router.post('/bloqueos/desbloquear', verifyToken, desbloquearUsuario);
router.get('/bloqueos/mis-bloqueados', verifyToken, obtenerBloqueados);
router.get('/bloqueos/verificar', verifyToken, verificarBloqueo);

export default router;
