import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import feedRoutes from './routes/feedRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import historialRoutes from './routes/historialRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/historial', historialRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend funcionando correctamente' });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Probar conexión a PostgreSQL (Supabase)
    await testConnection();

    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(`📝 Documentación: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
