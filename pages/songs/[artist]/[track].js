import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { pool } from '../../../lib/db.js';
import { Vibrant } from 'node-vibrant/browser';

// Helper to count total comments (including one level of replies).
function countComments(comments) {
  return comments.reduce((acc, comment) => {
    const childCount = comment.replies ? countComments(comment.replies) : 0;
    return acc + 1 + childCount;
  }, 0);
}

const BASE_URL = process.env.SEARCH_API_URL || 'http://localhost:8000';

export async function getServerSideProps(context) {
  const { artist, track } = context.params;
  const safeArtist = decodeURIComponent(artist).trim();
  const safeTrack = decodeURIComponent(track).trim();

  let existingAnalysis = null;
  let coverArt = '';
  let analysisId = null;
  let version = 1;
  let originalAnalysisId = null;

  // 1) Check if an analysis exists for this song.
  const existingRes = await pool.query(
    `SELECT a.analysis_id, a.ai_response, a.version, a.original_analysis_id
     FROM analyses a
     JOIN songs s ON a.song_id = s.song_id
     WHERE s.artist = $1 AND s.track = $2
     ORDER BY a.version DESC
     LIMIT 1`,
    [safeArtist, safeTrack]
  );

  if (existingRes.rows.length > 0) {
    try {
      const row = existingRes.rows[0];
      const parsed = JSON.parse(row.ai_response);
      if ((parsed.sectionAnalyses && parsed.sectionAnalyses.length > 0) || parsed.introduction) {
        existingAnalysis = parsed;
        coverArt = parsed.coverArt || '';
        analysisId = row.analysis_id;
        version = row.version;
        // Use original_analysis_id if available; otherwise default to analysisId.
        originalAnalysisId = row.original_analysis_id || row.analysis_id;
      }
    } catch (err) {
      console.error('Error parsing existing analysis JSON:', err);
    }
  }

  // 2) If no valid analysis exists, call /search_lyrics and /analyze_lyrics, then insert the new analysis.
  if (!existingAnalysis) {
    const searchUrl = `${BASE_URL}/search_lyrics?artist_name=${encodeURIComponent(
      safeArtist
    )}&track_name=${encodeURIComponent(safeTrack)}`;
    let searchJson;
    try {
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) {
        return { notFound: true };
      }
      searchJson = await searchRes.json();
    } catch (err) {
      console.error('Error calling /search_lyrics:', err);
      return { notFound: true };
    }
    const { results = [] } = searchJson;
    if (results.length === 0) {
      return { notFound: true };
    }
    const recordId = results[0].id;
    coverArt = results[0].cover_art || '';

    const analyzeUrl = `${BASE_URL}/analyze_lyrics?record_id=${encodeURIComponent(
      recordId
    )}&track=${encodeURIComponent(safeTrack)}&artist=${encodeURIComponent(safeArtist)}`;
    let analyzeJson;
    try {
      const analyzeRes = await fetch(analyzeUrl);
      if (!analyzeRes.ok) {
        return { notFound: true };
      }
      analyzeJson = await analyzeRes.json();
    } catch (err) {
      console.error('Error calling /analyze_lyrics:', err);
      return { notFound: true };
    }
    const finalAnalysis = analyzeJson.analysis || {};
    finalAnalysis.coverArt = coverArt;

    // Insert or retrieve the song row.
    const songRes = await pool.query(
      'SELECT song_id FROM songs WHERE artist=$1 AND track=$2 LIMIT 1',
      [safeArtist, safeTrack]
    );
    let songId;
    if (songRes.rows.length === 0) {
      const insSongRes = await pool.query(
        'INSERT INTO songs (artist, track) VALUES ($1, $2) RETURNING song_id',
        [safeArtist, safeTrack]
      );
      songId = insSongRes.rows[0].song_id;
    } else {
      songId = songRes.rows[0].song_id;
    }

    const insRes = await pool.query(
      'INSERT INTO analyses (song_id, version, ai_response) VALUES ($1, $2, $3) RETURNING analysis_id',
      [songId, 1, JSON.stringify(finalAnalysis)]
    );
    analysisId = insRes.rows[0].analysis_id;
    version = 1;
    // Set original_analysis_id equal to analysisId for a new analysis.
    await pool.query(
      'UPDATE analyses SET original_analysis_id = $1 WHERE analysis_id = $1',
      [analysisId]
    );
    originalAnalysisId = analysisId;
    existingAnalysis = finalAnalysis;
  }

  // 3) Log a view for the current analysis row.
  await pool.query('INSERT INTO analysis_view_logs (analysis_id) VALUES ($1)', [analysisId]);
  // Sum view logs across all analyses sharing the same original_analysis_id.
  const viewRes = await pool.query(
    `SELECT COUNT(*) AS total_views FROM analysis_view_logs
     WHERE analysis_id IN (
       SELECT analysis_id FROM analyses WHERE original_analysis_id = $1
     )`,
    [originalAnalysisId]
  );
  const viewCount = parseInt(viewRes.rows[0].total_views, 10);

  // 4) Query comment count (for the current analysis only).
  const commentRes = await pool.query(
    'SELECT COUNT(*) AS comment_count FROM comments WHERE analysis_id = $1',
    [analysisId]
  );
  const commentCount = parseInt(commentRes.rows[0].comment_count, 10);

  console.log('Cover art URL:', coverArt);
  if (!coverArt || coverArt === '') {
    coverArt = 'https://via.placeholder.com/300?text=No+Cover+Art';
  }

  return {
    props: {
      artist: safeArtist,
      track: safeTrack,
      analysis: existingAnalysis,
      coverArt,
      version,
      viewCount,
      commentCount,
    },
  };
}

export default function SongPage({
  artist,
  track,
  analysis,
  coverArt,
  version,
  viewCount,
  commentCount: initialCommentCount,
}) {
  const router = useRouter();
  const [dominantColor, setDominantColor] = useState(analysis.dominantColor || '#000');
  const [comments, setComments] = useState([]);
  const [topLevelText, setTopLevelText] = useState('');
  const [replyTexts, setReplyTexts] = useState({});
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  // Function to extract dominant color after cover art image loads.
  const handleCoverArtLoad = useCallback(() => {
    if (coverArt) {
      Vibrant.from(coverArt)
        .getPalette()
        .then((palette) => {
          const primary = palette?.Vibrant?.hex || '#000';
          setDominantColor(primary);
        })
        .catch((err) => {
          console.error('Error extracting dominant color:', err);
          setDominantColor('#000');
        });
    }
  }, [coverArt]);

  // Reload comments from /api/comments.
  async function reloadComments() {
    try {
      const res = await fetch(
        `/api/comments?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`
      );
      const data = await res.json();
      let fetchedComments = data.comments || [];

      // Sort top-level by upvote_count desc, then date asc.
      fetchedComments.sort((a, b) => {
        if (b.upvote_count !== a.upvote_count) return b.upvote_count - a.upvote_count;
        return new Date(a.created_at) - new Date(b.created_at);
      });

      // Sort replies (one level).
      function sortReplies(arr) {
        arr.forEach((c) => {
          if (c.replies && c.replies.length > 0) {
            c.replies.sort((x, y) => {
              if (y.upvote_count !== x.upvote_count) return y.upvote_count - x.upvote_count;
              return new Date(x.created_at) - new Date(y.created_at);
            });
          }
        });
      }
      sortReplies(fetchedComments);

      setComments(fetchedComments);
      setCommentCount(fetchedComments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0));
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  }

  // Handle up/down vote.
  async function handleVote(commentId, voteType) {
    try {
      const res = await fetch('/api/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, voteType }),
      });
      const data = await res.json();
      if (!data.error) {
        reloadComments();
      }
    } catch (err) {
      console.error('Upvote/downvote error:', err);
    }
  }

  // Post top-level comment.
  async function handleTopLevelSubmit(e) {
    e.preventDefault();
    if (!topLevelText.trim()) return;
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist,
          track,
          text: topLevelText.trim(),
          parent_comment_id: null,
        }),
      });
      if (res.ok) {
        setTopLevelText('');
        reloadComments();
      } else {
        console.error('Failed to post comment');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  }

  // Post reply (2nd-level only).
  async function handleReplySubmit(parentId) {
    const text = replyTexts[parentId];
    if (!text || !text.trim()) return;
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist,
          track,
          text: text.trim(),
          parent_comment_id: parentId,
        }),
      });
      if (res.ok) {
        setReplyTexts((prev) => ({ ...prev, [parentId]: '' }));
        reloadComments();
      } else {
        console.error('Failed to post reply');
      }
    } catch (err) {
      console.error('Error posting reply:', err);
    }
  }

  // Render a comment (two layers).
  function renderComment(comment, depth = 0) {
    const allowReply = depth < 1;
    return (
      <div key={comment.comment_id} className="comment-block">
        <div className="comment-avatar">
          <img src="/avatarPlaceholder.png" alt="Profile" className="avatar-img" />
        </div>
        <div className="comment-body">
          <div className="comment-text">{comment.text}</div>
          <div className="comment-actions">
            <button onClick={() => handleVote(comment.comment_id, 'up')}>↑</button>
            <span className="comment-upvotes">{comment.upvote_count}</span>
            <button onClick={() => handleVote(comment.comment_id, 'down')}>↓</button>
            {allowReply && (
              <button
                onClick={() =>
                  setReplyTexts((prev) =>
                    prev[comment.comment_id] === undefined
                      ? { ...prev, [comment.comment_id]: '' }
                      : { ...prev, [comment.comment_id]: undefined }
                  )
                }
              >
                {replyTexts[comment.comment_id] !== undefined ? 'Cancel' : 'Reply'}
              </button>
            )}
          </div>
          {replyTexts[comment.comment_id] !== undefined && allowReply && (
            <div className="comment-reply">
              <textarea
                value={replyTexts[comment.comment_id]}
                onChange={(e) =>
                  setReplyTexts((prev) => ({ ...prev, [comment.comment_id]: e.target.value }))
                }
                placeholder="Add your perspective..."
              />
              <button onClick={() => handleReplySubmit(comment.comment_id)}>Submit</button>
            </div>
          )}
          {comment.replies && depth < 1 && comment.replies.map((child) => renderComment(child, depth + 1))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        {/* SEO Meta Tags */}
        <title>{`${track} by ${artist} – In-Depth Song Analysis (v${version})`}</title>
        <meta
          name="description"
          content={
            analysis.introduction ||
            `Explore an in-depth analysis of "${track}" by ${artist}. Discover thematic insights and cultural nuances that resonate with fans.`
          }
        />
        <link
          rel="canonical"
          href={`https://yourdomain.com/songs/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`}
        />
        <meta property="og:title" content={`${track} by ${artist} – In-Depth Song Analysis (v${version})`} />
        <meta
          property="og:description"
          content={
            analysis.introduction ||
            `Explore an in-depth analysis of "${track}" by ${artist}. Discover thematic insights and cultural nuances that resonate with fans.`
          }
        />
        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content={`https://yourdomain.com/songs/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`}
        />
        <meta
          property="og:image"
          content={analysis.coverArt || 'https://via.placeholder.com/300?text=No+Cover+Art'}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${track} by ${artist} – In-Depth Song Analysis (v${version})`} />
        <meta
          name="twitter:description"
          content={
            analysis.introduction ||
            `Explore an in-depth analysis of "${track}" by ${artist}. Discover thematic insights and cultural nuances that resonate with fans.`
          }
        />
        <meta
          name="twitter:image"
          content={analysis.coverArt || 'https://via.placeholder.com/300?text=No+Cover+Art'}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Root container with default white background */}
      <div className="analysis-page-container">
        <header className="analysis-header">
          <span className="nav-link" onClick={() => alert('About page coming soon!')}>
            About
          </span>
          <img
            src="/logo2.png"
            alt="Scalpel Logo"
            className="analysis-header-logo"
            onClick={() => router.push('/')}
          />
        </header>

        {/* Hero with gradient from dominantColor to white */}
        <section
          className="analysis-hero"
          style={{ background: `linear-gradient(180deg, ${dominantColor}, #fff)` }}
        >
          <img
            className="analysis-cover-art"
            src={coverArt}
            alt="Cover Art"
            onLoad={handleCoverArtLoad}
          />
          <h1 className="analysis-title">{track}</h1>
          <p className="analysis-artist">{artist}</p>
          <p className="analysis-song-label">Song</p>
        </section>

        <main className="analysis-main">
          {/* Stats row */}
          <section className="analysis-stats">
            <div className="analysis-stat">
              <svg viewBox="0 0 18 12" width="18" height="12" fill="currentColor">
                <path d="M9 0C4.9 0 1.2 2.4 0 6c1.2 3.6 4.9 6 9 6s7.8-2.4 9-6c-1.2-3.6-4.9-6-9-6zm0 9c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" />
              </svg>
              <span>{viewCount}</span>
            </div>
            <div className="analysis-stat">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M21 6h-18v12h4v4l4-4h10z" />
              </svg>
              <span>{commentCount}</span>
            </div>
            <div className="analysis-stat">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M4 4h16v2h-16v-2zm0 5h16v2h-16v-2zm0 5h16v2h-16v-2z" />
              </svg>
              <span>{version ? version - 1 : 0}</span>
            </div>
          </section>

          {/* Analysis text */}
          <section className="analysis-content">
            {analysis.overallHeadline && (
              <h2 className="analysis-headline">{analysis.overallHeadline}</h2>
            )}
            {analysis.introduction && (
              <p className="analysis-intro">{analysis.introduction}</p>
            )}
            {analysis.sectionAnalyses?.map((sec, idx) => (
              <div key={idx} className="analysis-block">
                <h3 className="analysis-section-title">
                  {sec.sectionName.toUpperCase()}
                  {sec.verseSummary && `: ${sec.verseSummary}`}
                </h3>
                {sec.quotedLines && (
                  <blockquote className="analysis-quote">{sec.quotedLines}</blockquote>
                )}
                <p className="analysis-text">{sec.analysis}</p>
              </div>
            ))}
            {analysis.conclusion && (
              <p className="analysis-conclusion">{analysis.conclusion}</p>
            )}
          </section>

          {/* Comments */}
          <section className="analysis-comments">
            <h3 className="analysis-comments-title">Comments ({commentCount})</h3>
            <form onSubmit={handleTopLevelSubmit} className="analysis-comment-form">
              <textarea
                placeholder="Add your perspective... it may be woven into the analysis."
                value={topLevelText}
                onChange={(e) => setTopLevelText(e.target.value)}
              />
              <button type="submit">Post</button>
            </form>
            <div className="analysis-comments-list">
              {comments.map((c) => renderComment(c, 0))}
            </div>
          </section>
        </main>
      </div>

      <style jsx>{`
        /* Page container */
        .analysis-page-container {
          background: #fff;
          color: #000;
          font-family: 'Poppins', sans-serif;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }
        /* Header */
        .analysis-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: #eee;
          border-bottom: 1px solid #ccc;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 1000;
        }
        .analysis-header-logo {
          height: 40px;
          cursor: pointer;
        }
        .nav-link {
          font-size: 0.9rem;
          color: #333;
          cursor: pointer;
        }
        /* Hero section */
        .analysis-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 80px;
          padding-bottom: 20px;
          transition: background 0.5s ease;
        }
        .analysis-cover-art {
          max-width: 300px;
          border-radius: 4px;
          margin-bottom: 16px;
        }
        .analysis-title {
          margin: 0;
          font-size: 1.8rem;
          font-weight: bold;
          text-align: center;
        }
        .analysis-artist {
          margin: 4px 0;
          font-size: 1rem;
          font-weight: 500;
          text-align: center;
        }
        .analysis-song-label {
          margin: 0;
          font-size: 0.85rem;
          color: #666;
          text-align: center;
        }
        /* Main content */
        .analysis-main {
          margin-top: 60px;
          padding: 20px;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
        }
        /* Stats row */
        .analysis-stats {
          display: flex;
          gap: 20px;
          justify-content: center;
          align-items: center;
          margin-bottom: 30px;
        }
        .analysis-stat {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #666;
          font-size: 0.9rem;
        }
        /* Analysis content area */
        .analysis-content {
          line-height: 1.6;
        }
        .analysis-headline {
          font-size: 1.4rem;
          font-weight: bold;
          margin-bottom: 12px;
          text-transform: uppercase;
        }
        .analysis-intro {
          margin-bottom: 16px;
          font-size: 1rem;
        }
        .analysis-block {
          margin-bottom: 20px;
        }
        .analysis-section-title {
          font-size: 1rem;
          font-weight: bold;
          text-transform: uppercase;
          margin: 0 0 8px 0;
        }
        .analysis-quote {
          font-style: italic;
          margin: 8px 0;
          padding-left: 12px;
          border-left: 3px solid #ccc;
          line-height: 1.4;
        }
        .analysis-text {
          font-size: 0.95rem;
          margin-bottom: 10px;
        }
        .analysis-conclusion {
          margin-top: 30px;
          font-weight: 500;
        }
        /* Comments section */
        .analysis-comments {
          margin-top: 40px;
        }
        .analysis-comments-title {
          font-size: 1.1rem;
          margin-bottom: 10px;
        }
        .analysis-comment-form {
          display: flex;
          flex-direction: column;
          margin-bottom: 10px;
        }
        .analysis-comment-form textarea {
          width: 100%;
          min-height: 50px;
          margin-bottom: 8px;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          resize: vertical;
          font-size: 0.9rem;
        }
        .analysis-comment-form button {
          align-self: flex-end;
          padding: 6px 12px;
          background: #007aff;
          border: none;
          border-radius: 4px;
          color: #fff;
          cursor: pointer;
        }
        .analysis-comments-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        /* Individual comment blocks */
        .comment-block {
          display: flex;
          gap: 10px;
          background: #f8f8f8;
          border-radius: 4px;
          padding: 8px;
        }
        .comment-avatar {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          background: #ddd;
        }
        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .comment-body {
          flex: 1;
        }
        .comment-text {
          margin-bottom: 6px;
          font-size: 0.9rem;
        }
        .comment-actions {
          display: flex;
          gap: 6px;
          font-size: 0.85rem;
          align-items: center;
        }
        .comment-upvotes {
          font-weight: 600;
        }
        .comment-reply {
          margin-top: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .comment-reply textarea {
          width: 100%;
          min-height: 40px;
          font-size: 0.85rem;
          padding: 6px;
          border: 1px solid #ccc;
          border-radius: 4px;
          resize: vertical;
        }
      `}</style>
    </>
  );
}
