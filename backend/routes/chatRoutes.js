import express from 'express';
import { verifyToken, verifyActiveAccount } from '../middleware/auth.js';
import {
  listUsersForChat,
  listConversations,
  getOrCreateConversation,
  listMessages,
  sendMessage,
  editMessage,
  deleteMessage,
} from '../controllers/chatController.js';
import {
  bloquearUsuario,
  desbloquearUsuario,
  obtenerBloqueados,
  verificarBloqueo,
} from '../controllers/bloqueosController.js';

const router = express.Router();

// 1. Usuarios disponibles para chatear
router.get('/usuarios', verifyToken, verifyActiveAccount, listUsersForChat);

// 2. Rutas del Chat (Conversaciones y Mensajes)
router.get('/conversaciones', verifyToken, verifyActiveAccount, listConversations);
router.post('/conversaciones', verifyToken, verifyActiveAccount, getOrCreateConversation);
router.get('/conversaciones/:conversacionId/mensajes', verifyToken, verifyActiveAccount, listMessages);
router.post('/conversaciones/:conversacionId/mensajes', verifyToken, verifyActiveAccount, sendMessage);
router.patch('/mensajes/:mensajeId', verifyToken, verifyActiveAccount, editMessage);
router.delete('/mensajes/:mensajeId', verifyToken, verifyActiveAccount, deleteMessage);

// 3. Rutas de Bloqueos
router.post('/bloqueos', verifyToken, verifyActiveAccount, bloquearUsuario);
router.post('/bloqueos/desbloquear', verifyToken, verifyActiveAccount, desbloquearUsuario);
router.get('/bloqueos/mis-bloqueados', verifyToken, verifyActiveAccount, obtenerBloqueados);
router.get('/bloqueos/verificar', verifyToken, verifyActiveAccount, verificarBloqueo);

export default router;