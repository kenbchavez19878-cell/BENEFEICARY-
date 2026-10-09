import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'benefitrack',
  password: process.env.PGPASSWORD || undefined,
  port: parseInt(process.env.PGPORT || '5432', 10),
});

export async function runMigrations() {
  console.log('--- Running BenefitTrack PostgreSQL Migrations ---');
  const client = await pool.connect();
  try {
    const migrationFile = path.resolve(__dirname, '../../../db/migrations/001_create_case_workflow_tables.sql');
    console.log(`Executing migration: ${migrationFile}`);
    const migrationSql = fs.readFileSync(migrationFile, 'utf8');
    await client.query(migrationSql);
    console.log('Migration executed successfully!');

    const seedFile = path.resolve(__dirname, '../../../db/seeds/001_seed_cases.sql');
    if (fs.existsSync(seedFile)) {
      console.log(`Executing seed data: ${seedFile}`);
      const seedSql = fs.readFileSync(seedFile, 'utf8');
      await client.query(seedSql);
      console.log('Seed data inserted successfully!');
    }

    const womenRes = await client.query('SELECT count(*) FROM women_and_solo_parent_cases');
    const aicsRes = await client.query('SELECT count(*) FROM aics_cases');
    console.log(`Verified table records:`);
    console.log(`- women_and_solo_parent_cases: ${womenRes.rows[0].count}`);
    console.log(`- aics_cases: ${aicsRes.rows[0].count}`);
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('Migration completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
