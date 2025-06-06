// File: pages/api/analysisCheck.js

const { pool } = require('../lib/db.js');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { artist, track } = req.query;
  if (!artist || !track) {
    return res.status(400).json({ error: 'Missing artist or track' });
  }

  try {
    const existing = await pool.query(
      `SELECT s.song_id
         FROM songs s
    LEFT JOIN analyses a ON s.song_id = a.song_id
        WHERE s.artist = $1 AND s.track = $2
     ORDER BY a.version DESC
        LIMIT 1`,
      [artist.trim(), track.trim()]
    );
    // If row found and has a non-null analysis, we assume it's "exists: true"
    if (existing.rows.length > 0) {
      // Optionally check if there's an actual analysis in 'analyses' table.
      // For simplicity, we assume if the row exists, we have at least a stub. 
      // Adjust as needed.
      return res.status(200).json({ exists: true });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (err) {
    console.error('Error checking analysis existence:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
