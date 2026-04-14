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
  max: 10,
});

export const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Conectado a PostgreSQL (Supabase) exitosamente');
  } catch (error) {
    const msg = String(error.message);
    console.error('Error conectando a PostgreSQL:', msg);
    if (/ENOTFOUND|getaddrinfo|EAI_AGAIN/i.test(msg)) {
      console.error(
        '\nENOTFOUND suele indicar que tu red/PC no resuelve o no alcanza el host de la conexión DIRECTA.\n' +
          'Supabase usa IPv6 en db.PROJECT_REF.supabase.co; muchas redes Windows solo IPv4 fallan así.\n\n' +
          'Qué hacer: Dashboard Supabase → Connect (Conectar) → modo "Session pooler" / "Session mode".\n' +
          'Copia esa URI completa a DATABASE_URL en backend/.env (host tipo aws-0-REGION.pooler.supabase.com,\n' +
          'usuario postgres.TU_PROJECT_REF, puerto 5432). No pegues espacios ni comillas alrededor.\n' +
          'Si usas conexión directa, revisa que el host sea exactamente el del panel (sin typos).\n'
      );
    } else if (/password|28P01|SASL/i.test(msg)) {
      console.error(
        'Pista: revisa la contraseña en DATABASE_URL. Los caracteres especiales deben ir codificados en la URI.'
      );
    }
    process.exit(1);
  }
};
