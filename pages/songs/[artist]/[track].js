import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
const { pool } = require('../../../lib/db.js');
const Vibrant = require('node-vibrant');

// Helper to count total comments (including one level of replies).
function countComments(comments) {
  return comments.reduce((acc, comment) => {
    const childCount = comment.replies ? countComments(comment.replies) : 0;
    return acc + 1 + childCount;
  }, 0);
}

const BASE_URL = process.env.SEARCH_API_URL || 'http://localhost:8000';

export async function getServerSideProps(context) {
  const { artist, track } = context.query;
  
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/song-details?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`);
    return {
      props: {
        initialData: response.data
      }
    };
  } catch (error) {
    console.error('Error fetching initial data:', error);
    return {
      props: {
        initialData: null
      }
    };
  }
}

export default function SongPage({ initialData }) {
  const router = useRouter();
  const { artist, track } = router.query;
  const [songData, setSongData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [dominantColor, setDominantColor] = useState(songData?.analysis?.dominantColor || '#000');
  const [comments, setComments] = useState([]);
  const [topLevelText, setTopLevelText] = useState('');
  const [replyTexts, setReplyTexts] = useState({});
  const [commentCount, setCommentCount] = useState(songData?.commentCount || 0);

  useEffect(() => {
    if (!artist || !track) return;

    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/song-details?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`);
        setSongData(response.data);
      } catch (error) {
        console.error('Error fetching song data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!initialData) {
      fetchData();
    }
  }, [artist, track, initialData]);

  // Function to extract dominant color after cover art image loads.
  const handleCoverArtLoad = useCallback(() => {
    if (songData?.coverArt) {
      Vibrant.from(songData.coverArt)
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
  }, [songData.coverArt]);

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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>{songData?.track || 'Song'} by {songData?.artist || 'Artist'} - Scalpel</title>
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
            src={songData?.coverArt}
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
              <span>{songData?.viewCount}</span>
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
              <span>{songData?.version ? songData.version - 1 : 0}</span>
            </div>
          </section>

          {/* Analysis text */}
          <section className="analysis-content">
            {songData?.analysis?.overallHeadline && (
              <h2 className="analysis-headline">{songData.analysis.overallHeadline}</h2>
            )}
            {songData?.analysis?.introduction && (
              <p className="analysis-intro">{songData.analysis.introduction}</p>
            )}
            {songData?.analysis?.sectionAnalyses?.map((sec, idx) => (
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
            {songData?.analysis?.conclusion && (
              <p className="analysis-conclusion">{songData.analysis.conclusion}</p>
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
