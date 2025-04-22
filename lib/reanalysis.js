// File: reanalysis.js
import { pool } from './db.js';
import axios from 'axios';

/**
 * Triggers a cumulative reanalysis for a given comment.
 * Each reanalysis creates a NEW row in the analyses table with:
 * - The same song_id.
 * - version = previous version + 1.
 * - The updated ai_response.
 * - The same original_analysis_id (to link all versions together).
 * - view_count copied from the previous row.
 *
 * @param {number} oldAnalysisId - The ID of an existing analysis (used to determine the song and chain).
 * @param {number} commentId - The comment that triggered the reanalysis.
 * @returns {Object} The updated analysis (following the LyricAnalysis schema).
 */
export async function triggerReAnalysis(oldAnalysisId, commentId) {
  try {
    // 1. Fetch the latest analysis for the song using the song_id from the given analysis.
    //    This row includes original_analysis_id and view_count.
    const latestAnalysisRes = await pool.query(
      `SELECT a.analysis_id, a.song_id, a.ai_response, s.artist, s.track,
              a.version, a.view_count, a.original_analysis_id
       FROM analyses a
       JOIN songs s ON a.song_id = s.song_id
       WHERE s.song_id = (
         SELECT song_id FROM analyses WHERE analysis_id = $1
       )
       ORDER BY a.version DESC
       LIMIT 1`,
      [oldAnalysisId]
    );
    if (latestAnalysisRes.rows.length === 0) {
      throw new Error('Latest analysis not found');
    }
    const {
      song_id,
      ai_response,
      artist,
      track,
      version: currentVersion,
      view_count: currentViewCount,
      original_analysis_id
    } = latestAnalysisRes.rows[0];

    // 2. Fetch the comment text and upvote count.
    const commentRes = await pool.query(
      `SELECT text, upvote_count FROM comments WHERE comment_id = $1`,
      [commentId]
    );
    if (commentRes.rows.length === 0) {
      throw new Error('Comment not found');
    }
    const { text: commentText, upvote_count } = commentRes.rows[0];

    // 3. Only trigger reanalysis if upvote count is 10 or greater.
    if (upvote_count < 10) {
      console.log(`Comment ${commentId} has only ${upvote_count} upvotes; not triggering reanalysis.`);
      return;
    }

    // 4. Call the FastAPI /re_analyze endpoint to integrate the new comment.
    const response = await axios.post(
      `${process.env.FASTAPI_BASE_URL}/re_analyze`,
      {
        oldAnalysis: JSON.parse(ai_response),
        newComment: commentText,
        artist,
        track
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    const updatedAnalysis = response.data;

    // 5. Insert a new analysis row with the updated analysis.
    //    Copy the view_count from the latest row and preserve the original_analysis_id.
    const newVersion = currentVersion + 1;
    updatedAnalysis.version = newVersion;
    const insertRes = await pool.query(
      `INSERT INTO analyses (song_id, version, ai_response, view_count, original_analysis_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING analysis_id`,
      [
        song_id,
        newVersion,
        JSON.stringify(updatedAnalysis),
        currentViewCount,
        original_analysis_id
      ]
    );
    console.log('Re-analysis complete. New analysis row inserted with analysis_id = ', insertRes.rows[0].analysis_id);
    return updatedAnalysis;
  } catch (error) {
    console.error('Error triggering re-analysis:', error);
    throw error;
  }
}
