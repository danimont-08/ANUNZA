import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
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

// ── Seguridad: cabeceras HTTP ──────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // La API no sirve HTML
}));

// ── CORS ───────────────────────────────────────────────────────────────
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

// ── Compresión gzip ────────────────────────────────────────────────────
app.use(compression());

// ── Rate limiting global ───────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes, intenta más tarde.' },
});

// Límite estricto para auth (previene fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de autenticación, intenta más tarde.' },
});

app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Body parsing ───────────────────────────────────────────────────────
// 10 MB máximo (base64 de imágenes); 25 MB era excesivo
app.use(express.json({ limit: '10mb' }));

// ── Rutas ──────────────────────────────────────────────────────────────
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

// ── Manejo de errores global ───────────────────────────────────────────
app.use((err, req, res, _next) => {
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ message: err.message });
  }
  console.error('Error no manejado:', err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

// ── Arranque ───────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
