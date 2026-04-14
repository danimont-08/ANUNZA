import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error(
    'Error: DATABASE_URL no está definida.\n' +
      'Crea backend/.env con DATABASE_URL (Supabase → Project Settings → Database → URI).\n' +
      'Sustituye [YOUR-PASSWORD] por la contraseña real; si tiene @ # / etc., codifícala en la URL (encodeURIComponent).'
  );
  process.exit(1);
}

/**
 * Pool de conexiones a PostgreSQL (Supabase).
 * URI directa: postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
 */
export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL !== 'false' ? { rejectUnauthorized: false } : false,
  max: 10,                        // Transaction Pooler: hasta ~15 en plan free; 10 deja margen para multi-usuario
  idleTimeoutMillis: 30000,       // Liberar conexiones inactivas a los 30s
  connectionTimeoutMillis: 15000, // Esperar hasta 15s antes de fallar
  keepAlive: true,                // Mantener TCP vivo; reduce latencia en conexiones reutilizadas
  keepAliveInitialDelayMillis: 10000,
});

export const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Conectado a PostgreSQL (Supabase) exitosamente');

    // Keep-alive: ping cada 4 min para evitar que Supabase pause la BD 
   
    setInterval(async () => {
      try {
        await pool.query('SELECT 1');
      } catch {
        
      }
    }, 4 * 60 * 1000); // cada 4 minutos
  } catch (error) {
    const msg = String(error.message);
    console.error('Error conectando a PostgreSQL:', msg);
    if (/ENOTFOUND|getaddrinfo|EAI_AGAIN/i.test(msg)) {
      console.error(
        '\nENOTFOUND suele indicar que tu red/PC no resuelve o no alcanza el host de la conexión DIRECTA.\n' +
          'Supabase usa IPv6 en db.PROJECT_REF.supabase.co; muchas redes Windows solo IPv4 fallan así.\n\n' +
          'Qué hacer: Dashboard Supabase → Connect (Conectar) → modo "Transaction pooler".\n' +
          'Copia esa URI completa a DATABASE_URL en backend/.env (host tipo aws-0-REGION.pooler.supabase.com,\n' +
          'usuario postgres.TU_PROJECT_REF, puerto 6543). No pegues espacios ni comillas alrededor.\n'
      );
    } else if (/password|28P01|SASL/i.test(msg)) {
      console.error(
        'Revisar la contraseña en DATABASE_URL. Los caracteres especiales deben ir codificados en la URI.'
      );
    }
    process.exit(1);
  }
};

