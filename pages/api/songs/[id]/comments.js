import { pool } from '../../../../lib/db.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const rows = await pool.query(
        `
        SELECT c.comment_id, c.text, c.upvote_count, c.parent_comment_id,
               c.created_at, c.updated_at, c.user_id, u.username
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.user_id
        JOIN analyses a ON c.analysis_id = a.analysis_id
        JOIN songs s ON a.song_id = s.song_id
        WHERE s.song_id = $1
        ORDER BY c.created_at DESC
        `,
        [id]
      );

      return res.status(200).json(rows.rows);
    } catch (err) {
      console.error('Error fetching comments:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    const { content } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    try {
      // Get analysis_id for this song
      const analysisResult = await pool.query(
        'SELECT analysis_id FROM analyses WHERE song_id = $1',
        [id]
      );

      if (analysisResult.rows.length === 0) {
        return res.status(404).json({ error: 'Analysis not found for this song' });
      }

      const analysis_id = analysisResult.rows[0].analysis_id;
      let user_id = null;

      // If token provided, get user_id
      if (token) {
        const userResult = await pool.query(
          'SELECT user_id FROM users WHERE token = $1',
          [token]
        );
        if (userResult.rows.length > 0) {
          user_id = userResult.rows[0].user_id;
        }
      }

      // Insert comment
      const result = await pool.query(
        `
        INSERT INTO comments (analysis_id, text, user_id, upvote_count)
        VALUES ($1, $2, $3, 0)
        RETURNING comment_id, text, upvote_count, created_at, user_id
        `,
        [analysis_id, content, user_id]
      );

      // Get username if user_id exists
      if (user_id) {
        const userResult = await pool.query(
          'SELECT username FROM users WHERE user_id = $1',
          [user_id]
        );
        if (userResult.rows.length > 0) {
          result.rows[0].username = userResult.rows[0].username;
        }
      }

      return res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Error creating comment:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 