// test-db.js (located at the root of next_js_app)
import { pool } from './lib/db.js';

async function testConnection() {
  try {
    const result = await pool.query('SELECT * FROM songs');
    console.log('Songs:', result.rows);
  } catch (error) {
    console.error('Database connection test failed:', error);
  } finally {
    await pool.end();
  }
}

testConnection();
