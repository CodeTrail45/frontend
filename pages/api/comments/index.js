const { pool } = require('../../../lib/db.js');
const { getClientIp } = require('../../../lib/ipUtils.js');

// Helper to nest replies
function buildNestedComments(rows) {
  // Build a map from comment_id -> comment object
  const lookup = {};
  rows.forEach((row) => {
    row.replies = [];
    lookup[row.comment_id] = row;
  });

  // Attach each row to its parent's "replies" array
  const rootComments = [];
  rows.forEach((row) => {
    if (row.parent_comment_id) {
      const parent = lookup[row.parent_comment_id];
      if (parent) {
        parent.replies.push(row);
      }
    } else {
      rootComments.push(row);
    }
  });
  return rootComments;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // GET /api/comments?artist=...&track=...
    const { artist, track } = req.query;
    if (!artist || !track) {
      return res.status(400).json({ error: 'artist and track required' });
    }
    try {
      const rows = await pool.query(
        `
        SELECT c.comment_id, c.text, c.upvote_count, c.parent_comment_id,
               c.created_at, c.updated_at
        FROM comments c
        JOIN analyses a ON c.analysis_id = a.analysis_id
        JOIN songs s ON a.song_id = s.song_id
        WHERE s.artist = $1 AND s.track = $2
        ORDER BY c.comment_id ASC
        `,
        [artist, track]
      );

      // Build nested comments
      const nested = buildNestedComments(rows.rows);
      return res.status(200).json({ comments: nested });
    } catch (err) {
      console.error('Error fetching comments:', err);
      return res.status(500).json({ error: err.message });
    }
  } else if (req.method === 'POST') {
    // POST -> create comment or reply
    const { artist, track, text, parent_comment_id } = req.body;
    if (!artist || !track || !text) {
      return res.status(400).json({ error: 'artist, track, and text are required' });
    }
    try {
      // Find the analysis
      const aRes = await pool.query(
        `
        SELECT a.analysis_id
        FROM analyses a
        JOIN songs s ON a.song_id = s.song_id
        WHERE s.artist = $1 AND s.track = $2
        ORDER BY a.version DESC
        LIMIT 1
        `,
        [artist, track]
      );
      if (aRes.rows.length === 0) {
        return res.status(404).json({ error: 'No analysis found for this song' });
      }
      const analysisId = aRes.rows[0].analysis_id;

      const ip = getClientIp(req);

      // Insert new comment
      await pool.query(
        `
        INSERT INTO comments (analysis_id, text, upvote_count, ip_address, parent_comment_id)
        VALUES ($1, $2, 0, $3, $4)
        `,
        [analysisId, text.trim(), ip, parent_comment_id || null]
      );

      // Refetch comments
      const rows = await pool.query(
        `
        SELECT c.comment_id, c.text, c.upvote_count, c.parent_comment_id,
               c.created_at, c.updated_at
        FROM comments c
        WHERE c.analysis_id = $1
        ORDER BY c.comment_id ASC
        `,
        [analysisId]
      );

      const nested = buildNestedComments(rows.rows);
      return res.status(200).json({ comments: nested });
    } catch (err) {
      console.error('Error posting comment:', err);
      return res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} not allowed`);
  }
}
