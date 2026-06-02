import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { testConnection } from './config/database.js';
import { setIo } from './socket.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import feedRoutes from './routes/feedRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import historialRoutes from './routes/historialRoutes.js';
import notificacionesRoutes from './routes/notificacionesRoutes.js';
import reportesRoutes from './routes/reportesRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import moderadorRoutes from './routes/moderadorRoutes.js';
import pagosRoutes from './routes/pagosRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origen no permitido'));
  },
  credentials: true,
}));

app.use(compression());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 800,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes, intenta mas tarde.' },
  skip: (req) => req.path.startsWith('/api/notificaciones'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de autenticacion, intenta mas tarde.' },
});

app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/moderador', moderadorRoutes);
app.use('/api/pagos', pagosRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, req, res, _next) => {
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ message: err.message });
  }
  console.error('Error no manejado:', err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

// ── Socket.io ──────────────────────────────────────────────────────────
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

setIo(io);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No autenticado'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Token invalido'));
  }
});

io.on('connection', (socket) => {
  socket.on('join_conversation', (conversacionId) => {
    if (conversacionId) socket.join(`conv:${conversacionId}`);
  });
  socket.on('leave_conversation', (conversacionId) => {
    if (conversacionId) socket.leave(`conv:${conversacionId}`);
  });
});

// ── Arranque ───────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await testConnection();
    httpServer.listen(PORT, () => {
      console.log(`\n Servidor en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();