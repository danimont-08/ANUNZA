import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  listConversations,
  getOrCreateConversation,
  listMessages,
  sendMessage,
} from '../controllers/chatController.js';

const router = express.Router();

router.get('/conversaciones', verifyToken, listConversations);
router.post('/conversaciones', verifyToken, getOrCreateConversation);
router.get('/conversaciones/:conversacionId/mensajes', verifyToken, listMessages);
router.post('/conversaciones/:conversacionId/mensajes', verifyToken, sendMessage);

export default router;
