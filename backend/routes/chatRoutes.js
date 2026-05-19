import express from 'express';
import { verifyToken, verifyActiveAccount } from '../middleware/auth.js';
import {
  listUsersForChat,
  listConversations,
  getOrCreateConversation,
  listMessages,
  sendMessage,
} from '../controllers/chatController.js';

const router = express.Router();

router.get('/usuarios', verifyToken, verifyActiveAccount, listUsersForChat);
router.get('/conversaciones', verifyToken, verifyActiveAccount, listConversations);
router.post('/conversaciones', verifyToken, verifyActiveAccount, getOrCreateConversation);
router.get('/conversaciones/:conversacionId/mensajes', verifyToken, verifyActiveAccount, listMessages);
router.post('/conversaciones/:conversacionId/mensajes', verifyToken, verifyActiveAccount, sendMessage);

export default router;
