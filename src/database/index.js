const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({ connectionString: config.databaseUrl, max: 20, idleTimeoutMillis: 30_000 });
pool.on('error', (error) => console.error('Unexpected idle PostgreSQL client error', error));

module.exports = {
  query(text, params) { return pool.query(text, params); },
  async transaction(work) {
    const client = await pool.connect();
    try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; }
    catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  },
  close() { return pool.end(); },
};
