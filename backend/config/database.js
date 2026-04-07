import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Crear pool de conexiones a MySQL
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Probar conexión
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Conectado a MySQL exitosamente');
    connection.release();
  } catch (error) {
    console.error('✗ Error conectando a MySQL:', error.message);
    process.exit(1);
  }
};
