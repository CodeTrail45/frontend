// nextjs_app/lib/db.js
import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '12345678',
  database: process.env.POSTGRES_DB || 'lyrics_db',
  ssl: false // Disable SSL for local development
});
