import { pool } from '../../lib/db.js';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // This query counts the number of comments per analysis.
    // If ai_response is JSON, extract coverArt; otherwise, use a placeholder.
    const q = `
      SELECT 
        s.artist, 
        s.track, 
        CASE 
          WHEN substring(a.ai_response::text from 1 for 1) = '{'
            THEN a.ai_response::json->>'coverArt'
          ELSE 'https://via.placeholder.com/150'
        END AS cover_art,
        (
          SELECT COUNT(*) 
          FROM comments c 
          WHERE c.analysis_id = a.analysis_id
        ) AS comment_count,
        a.version
      FROM analyses a
      JOIN songs s ON a.song_id = s.song_id
      ORDER BY comment_count DESC, a.version DESC
      LIMIT 9
    `;
    const result = await pool.query(q);
    return res.status(200).json({ results: result.rows });
  } catch (error) {
    console.error('Error fetching most discussed:', error);
    return res.status(500).json({ error: error.message });
  }
}
