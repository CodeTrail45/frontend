// File: pages/api/trending.js
import { pool } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const result = await pool.query(
      `SELECT 
          s.artist, 
          s.track, 
          (a.ai_response::json->>'coverArt') AS cover_art,
          COUNT(*) AS total_views
       FROM analysis_view_logs avl
       JOIN analyses a ON avl.analysis_id = a.analysis_id
       JOIN songs s ON a.song_id = s.song_id
       WHERE avl.viewed_at >= NOW() - INTERVAL '7 days'
       GROUP BY s.artist, s.track, cover_art
       ORDER BY total_views DESC
       LIMIT 9`
    );
    return res.status(200).json({ trending: result.rows });
  } catch (err) {
    console.error('Error fetching trending:', err);
    return res.status(500).json({ error: err.message });
  }
}
