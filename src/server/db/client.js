import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'benefitrack',
  password: process.env.PGPASSWORD || undefined,
  port: parseInt(process.env.PGPORT || '5432', 10),
  max: 15,
  idleTimeoutMillis: 30000,
});

// Test connection on initialization
pool.query('SELECT current_database(), current_user')
  .then((res) => {
    console.log(`[Database] Connected to PostgreSQL '${res.rows[0].current_database}' as user '${res.rows[0].current_user}'`);
  })
  .catch((err) => {
    console.warn('[Database] PostgreSQL connection warning:', err.message);
  });
