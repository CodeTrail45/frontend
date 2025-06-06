const { pool } = require('../../lib/db.js');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { artist, track } = req.query;
  if (!artist || !track) {
    return res.status(400).json({ error: 'Missing artist or track' });
  }

  try {
    const result = await pool.query(
      `SELECT s.*, a.* 
       FROM songs s 
       LEFT JOIN analyses a ON s.song_id = a.song_id 
       WHERE s.artist = $1 AND s.track = $2 
       ORDER BY a.version DESC 
       LIMIT 1`,
      [artist.trim(), track.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching song details:', err);
    return res.status(500).json({ error: 'Server error' });
  }
} 