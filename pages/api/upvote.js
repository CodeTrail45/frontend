// File: pages/api/upvote.js
import { pool } from '../../lib/db.js';
import { triggerReAnalysis } from '../../lib/reanalysis.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  try {
    const { commentId, voteType } = req.body;
    if (voteType === 'up') {
      // Increase the upvote count and return the new count and associated analysis_id.
      const updateRes = await pool.query(
        `UPDATE comments
         SET upvote_count = upvote_count + 1
         WHERE comment_id = $1
         RETURNING upvote_count, analysis_id`,
        [commentId]
      );
      if (updateRes.rows.length === 0) {
        return res.status(404).json({ error: "Comment not found" });
      }
      const { upvote_count, analysis_id } = updateRes.rows[0];

      // Immediately return the updated count.
      res.status(200).json({ success: true, upvote_count });

      // Then trigger reanalysis if count is >= 10.
      if (upvote_count >= 10) {
        console.log(`Comment ${commentId} reached ${upvote_count} upvotes. Triggering reanalysis...`);
        await triggerReAnalysis(analysis_id, commentId);
      }
    } else if (voteType === 'down') {
      const updateRes = await pool.query(
        `UPDATE comments
         SET upvote_count = upvote_count - 1
         WHERE comment_id = $1
         RETURNING upvote_count`,
        [commentId]
      );
      res.status(200).json({ success: true, upvote_count: updateRes.rows[0].upvote_count });
    } else {
      res.status(400).json({ error: 'Invalid vote type' });
    }
  } catch (error) {
    console.error('Upvote/downvote error:', error);
    res.status(500).json({ error: error.message });
  }
}
