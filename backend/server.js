import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend funcionando correctamente' });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Probar conexión a MySQL
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
