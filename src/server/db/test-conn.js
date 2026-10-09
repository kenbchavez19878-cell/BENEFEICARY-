import pg from 'pg';

const { Pool } = pg;

async function testConnection() {
  const configs = [
    { user: 'postgres', host: 'localhost', port: 5432, database: 'benefitrack' },
    { user: 'postgres', host: 'localhost', port: 5432, database: 'benefitrack', password: '' },
    { user: 'postgres', host: 'localhost', port: 5432, database: 'postgres' },
  ];

  for (const config of configs) {
    console.log('Testing config:', config);
    try {
      const pool = new Pool(config);
      const res = await pool.query('SELECT current_database(), current_user, version()');
      console.log('Success! Connected:', res.rows[0]);
      await pool.end();
      return config;
    } catch (err) {
      console.log('Failed:', err.message);
    }
  }
}

testConnection();
