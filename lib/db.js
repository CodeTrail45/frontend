// nextjs_app/lib/db.js
import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.PG_HOST,         // e.g., "lyric-analyzer-db.cgvpk0zonb9u.us-west-1.rds.amazonaws.com"
  port: process.env.PG_PORT || 5432,   // default PostgreSQL port
  user: process.env.PG_USER,         // e.g., "scalpel"
  password: process.env.PG_PASSWORD, // e.g., "scalpel7952"
  database: process.env.PG_DATABASE, // e.g., "lyric-analyzer-db"
  ssl: { rejectUnauthorized: false }
});
