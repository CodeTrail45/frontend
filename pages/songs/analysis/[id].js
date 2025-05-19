import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';

export default function SongAnalysis() {
  const router = useRouter();
  const { id, title, artist } = router.query;
  const [analysis, setAnalysis] = useState(null);
  const [lyrics, setLyrics] = useState('');
  const [coverArt, setCoverArt] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapperRef = useRef(null);
  const [comments, setComments] = useState([
    { id: 1, user: 'musiclover22', text: 'This song has such deep meaning!', timestamp: '2 hours ago', likes: 12 },
    { id: 2, user: 'lyrical_genius', text: 'The wordplay in the second verse is incredible.', timestamp: '5 hours ago', likes: 8 },
    { id: 3, user: 'beat_explorer', text: 'Anyone notice how the production complements the lyrics perfectly?', timestamp: '1 day ago', likes: 24 },
  ]);
  const [newComment, setNewComment] = useState('');
  const [activeSection, setActiveSection] = useState('lyrics');

  useEffect(() => {
    if (!id || !title || !artist) return;
    setLoading(true);
    // Get cover art from search_lyrics for this id
    fetch(`http://localhost:8000/search_lyrics?track_name=${encodeURIComponent(title)}`)
      .then((res) => res.json())
      .then((data) => {
        const found = (data.results || []).find((s) => String(s.id) === String(id));
        if (found) setCoverArt(found.cover_art);
      });
    // Get analysis and lyrics
    fetch(`http://localhost:8000/analyze_lyrics?record_id=${encodeURIComponent(id)}&track=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`)
      .then((res) => res.json())
      .then((data) => {
        setAnalysis(data.analysis || null);
        setLyrics(data.lyrics || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, title, artist]);

  // Suggestions logic
  useEffect(() => {
    if (query.trim().length > 2) {
      const timer = setTimeout(() => {
        fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
          .then((res) => res.json())
          .then((data) => {
            setSuggestions(data.results || []);
            setShowSuggestions(true);
          })
          .catch(() => setSuggestions([]));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/searchresults?track_name=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSuggestionClick = (item) => {
    setQuery(item.title);
    setShowSuggestions(false);
    router.push(`/searchresults?track_name=${encodeURIComponent(item.title)}`);
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      const newCommentObj = {
        id: comments.length + 1,
        user: 'current_user',
        text: newComment,
        timestamp: 'Just now',
        likes: 0
      };
      setComments([newCommentObj, ...comments]);
      setNewComment('');
    }
  };

  const likeComment = (id) => {
    setComments(comments.map(comment => 
      comment.id === id ? {...comment, likes: comment.likes + 1} : comment
    ));
  };

  return (
    <>
      <Head>
        <title>{title ? `${title} – ${artist}` : 'Song'} | Scalpel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div className="page-container">
        <header className="header">
          <div className="header-left">
            <img src="/logo2.png" alt="Scalpel Logo" className="header-logo" onClick={() => router.push('/')} />
            <div className="nav-links">
              <span className="nav-link" onClick={() => router.push('/')}>Home</span>
              <span className="nav-link" onClick={() => alert('About page coming soon!')}>About</span>
              <span className="nav-link" onClick={() => alert('Charts page coming soon!')}>Charts</span>
            </div>
          </div>
          <div className="search-wrapper-header" ref={searchWrapperRef}>
            <form onSubmit={handleSearch} className="search-form-header">
              <div className="search-input-wrapper-header">
                <span className="search-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#777" viewBox="0 0 24 24">
                    <path d="M21.707 20.293l-5.387-5.387a7.5 7.5 0 10-1.414 1.414l5.387 5.387a1 1 0 001.414-1.414zM10.5 16a5.5 5.5 0 110-11 5.5 5.5 0 010 11z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search songs..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => {
                    if (query.trim().length > 2) setShowSuggestions(true);
                  }}
                />
              </div>
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(s)}
                  >
                    {s.cover_art && (
                      <img
                        src={s.cover_art}
                        alt="Cover"
                        className="suggestion-cover"
                      />
                    )}
                    <div className="suggestion-text">
                      <span className="suggestion-title">
                        {s.title} – {s.artist_names}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="header-right">
            <a href="https://www.instagram.com/medicine.boxx" target="_blank" rel="noopener noreferrer" className="icon-link">
              <img src="/676d86456b8d7df0ad9dfbbc_instagram-p-500.png" alt="Instagram" className="icon-img" />
            </a>
            <a href="https://www.tiktok.com/@medicine_box" target="_blank" rel="noopener noreferrer" className="icon-link">
              <img src="/676d8645748a7a3f311b4eca_tiktok-p-500.png" alt="TikTok" className="icon-img" />
            </a>
          </div>
        </header>

        <div className="futuristic-background">
          {loading ? (
            <div className="loading-container">
              <div className="pulse-loader"></div>
              <div className="loading-text">Loading song data...</div>
            </div>
          ) : (
            <div className="song-content-container">
              <div className="song-header-section">
                <div className="cover-art-container">
                  {coverArt ? (
                    <img src={coverArt} alt={title} className="cover-img-modern" />
                  ) : (
                    <div className="cover-placeholder">
                      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="3"></circle>
                        <line x1="12" y1="1" x2="12" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="23"></line>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                        <line x1="1" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="23" y2="12"></line>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                      </svg>
                    </div>
                  )}
                  <div className="pulse-rings"></div>
                </div>
                <div className="song-info">
                  <h1 className="song-title-modern">{title}</h1>
                  <h2 className="song-artist-modern">{artist}</h2>
                  <div className="song-stats">
                    <div className="stat-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      <span>2.4K</span>
                    </div>
                    <div className="stat-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                      <span>4.8</span>
                    </div>
                    <div className="stat-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      <span>{comments.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="content-tabs">
                <div 
                  className={`tab ${activeSection === 'lyrics' ? 'active' : ''}`}
                  onClick={() => setActiveSection('lyrics')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  Lyrics
                </div>
                <div 
                  className={`tab ${activeSection === 'comments' ? 'active' : ''}`}
                  onClick={() => setActiveSection('comments')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Comments
                </div>
              </div>

              <div className="content-section">
                {activeSection === 'lyrics' && (
                  <div className="lyrics-section-modern">
                    <div className="lyrics-header">
                      <h3>Lyrics</h3>
                    </div>
                    <div className="lyrics-content-modern">
                      <pre>{lyrics}</pre>
                    </div>
                  </div>
                )}

                {activeSection === 'comments' && (
                  <div className="comments-section">
                    <div className="comment-form-container">
                      <form onSubmit={handleAddComment} className="comment-form">
                        <div className="user-avatar">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                        <div className="comment-input-container">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="comment-input"
                          />
                          <button type="submit" className="comment-submit">Post</button>
                        </div>
                      </form>
                    </div>
                    <div className="comments-list">
                      {comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-avatar">
                            {comment.user === 'current_user' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                              </svg>
                            ) : (
                              <div className="avatar-circle">{comment.user[0].toUpperCase()}</div>
                            )}
                          </div>
                          <div className="comment-content">
                            <div className="comment-header">
                              <span className="comment-username">@{comment.user}</span>
                              <span className="comment-time">{comment.timestamp}</span>
                            </div>
                            <p className="comment-text">{comment.text}</p>
                            <div className="comment-actions">
                              <button className="comment-like" onClick={() => likeComment(comment.id)}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                </svg>
                                {comment.likes}
                              </button>
                              <button className="comment-reply">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="15 10 20 15 15 20"></polyline>
                                  <path d="M4 4v7a4 4 0 0 0 4 4h12"></path>
                                </svg>
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        .page-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', 'Poppins', sans-serif;
          overflow-x: hidden;
        }
        
        .futuristic-background {
          background: linear-gradient(135deg, #13111C, #1e1b2c, #292541);
          min-height: calc(100vh - 70px);
          padding-top: calc(70px + env(safe-area-inset-top));
          width: 100%;
          position: relative;
          overflow: hidden;
        }
        
        .futuristic-background::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 10% 20%, rgba(100, 80, 255, 0.03) 0%, transparent 20%),
            radial-gradient(circle at 90% 80%, rgba(255, 100, 180, 0.03) 0%, transparent 20%);
          pointer-events: none;
        }
        
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: calc(70px + env(safe-area-inset-top));
          padding-top: env(safe-area-inset-top);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-left: 20px;
          padding-right: 20px;
          background: rgba(19, 17, 28, 0.85);
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          transition: all 0.3s ease;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        
        .nav-links {
          display: flex;
          gap: 24px;
        }
        
        .nav-link {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          font-weight: 500;
          transition: color 0.2s ease;
          position: relative;
        }
        
        .nav-link:hover {
          color: #fff;
        }
        
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #8A2BE2, #FF1493);
          transition: width 0.3s ease;
        }
        
        .nav-link:hover::after {
          width: 100%;
        }
        
        .header-logo {
          height: 36px;
          width: auto;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .header-logo:hover {
          transform: scale(1.05);
        }
        
        .search-wrapper-header {
          position: relative;
          width: 350px;
        }
        
        .search-form-header {
          width: 100%;
        }
        
        .search-input-wrapper-header {
          position: relative;
          width: 100%;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .search-input-wrapper-header:hover, 
        .search-input-wrapper-header:focus-within {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 0 2px rgba(138, 43, 226, 0.1);
        }
        
        .search-icon {
          position: absolute;
          top: 50%;
          left: 14px;
          transform: translateY(-50%);
        }
        
        .search-form-header input {
          width: 100%;
          padding: 10px 14px 10px 40px;
          font-size: 0.9rem;
          border: none;
          border-radius: 20px;
          outline: none;
          background: transparent;
          color: #fff;
        }
        
        .search-form-header input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .suggestions-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 100%;
          background: rgba(30, 27, 44, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          max-height: 250px;
          overflow-y: auto;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
          z-index: 100;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .suggestion-item {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          cursor: pointer;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background 0.2s ease;
        }
        
        .suggestion-item:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .suggestion-cover {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 6px;
          margin-right: 12px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        .suggestion-text {
          overflow: hidden;
        }
        
        .suggestion-title {
          display: block;
          font-size: 0.85rem;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 500;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .icon-link {
          display: flex;
          align-items: center;
          transition: transform 0.2s ease;
        }
        
        .icon-link:hover {
          transform: scale(1.1);
        }
        
        .icon-img {
          width: 22px;
          height: 22px;
          opacity: 0.8;
          transition: opacity 0.2s ease;
        }
        
        .icon-img:hover {
          opacity: 1;
        }
        
        /* Song Content */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 70vh;
        }
        
        .pulse-loader {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8A2BE2, #FF1493);
          margin-bottom: 24px;
          position: relative;
          animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(138, 43, 226, 0.5);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 15px rgba(138, 43, 226, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(138, 43, 226, 0);
          }
        }
        
        .loading-text {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          letter-spacing: 0.5px;
        }
        
        .song-content-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 30px 20px;
        }
        
        .song-header-section {
          display: flex;
          align-items: center;
          margin-bottom: 40px;
          position: relative;
        }
        
        .cover-art-container {
          position: relative;
          margin-right: 30px;
        }
        
        .cover-img-modern {
          width: 220px;
          height: 220px;
          object-fit: cover;
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
          z-index: 2;
          position: relative;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .cover-img-modern:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
        }
        
        .cover-placeholder {
          width: 220px;
          height: 220px;
          border-radius: 12px;
          background: linear-gradient(45deg, #2c2a3a, #1a1825);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .pulse-rings {
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          border-radius: 16px;
          border: 1px solid rgba(138, 43, 226, 0.3);
          z-index: 1;
        }
        
        .pulse-rings::before,
        .pulse-rings::after {
          content: '';
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          border-radius: 20px;
          border: 1px solid rgba(255, 20, 147, 0.3);
          animation: pulsate 4s linear infinite;
        }
        
        .pulse-rings::after {
          animation-delay: -2s;
        }
        
        @keyframes pulsate {
          0% {
            transform: scale(0.85);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.2;
          }
          100% {
            transform: scale(0.85);
            opacity: 0.8;
          }
        }
        
        .song-info {
          flex: 1;
        }
        
        .song-title-modern {
          font-size: 2.5rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
          line-height: 1.2;
          background: linear-gradient(90deg, #fff, #b19cd9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 2px 10px rgba(138, 43, 226, 0.2);
        }
        
        .song-artist-modern {
          font-size: 1.3rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 20px;
          font-weight: 500;
        }
        
        .song-stats {
          display: flex;
          gap: 20px;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
        }
        
        .stat-item svg {
          color: rgba(255, 255, 255, 0.5);
        }
        
        .content-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 15px;
        }
        
        .tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          border-radius: 20px;
          transition: all 0.2s ease;
          font-weight: 500;
        }
        
        .tab:hover {
          color: rgba(255, 255, 255, 0.9);
        }
        
        .tab.active {
          background: linear-gradient(90deg, rgba(138, 43, 226, 0.2), rgba(255, 20, 147, 0.2));
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .content-section {
          min-height: 300px;
        }
        
        /* Lyrics Section */
        .lyrics-section-modern {
          background: rgba(30, 27, 44, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 30px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .lyrics-section-modern::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 10% 20%, rgba(138, 43, 226, 0.03) 0%, transparent 30%),
            radial-gradient(circle at 90% 80%, rgba(255, 20, 147, 0.03) 0%, transparent 30%);
          pointer-events: none;
        }
        
        .lyrics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .lyrics-header h3 {
          font-size: 1.4rem;
          color: #fff;
          font-weight: 600;
        }
        
        .lyrics-content-modern {
          position: relative;
          overflow-y: auto;
          max-height: 500px;
          padding-right: 10px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        
        .lyrics-content-modern::-webkit-scrollbar {
          width: 6px;
        }
        
        .lyrics-content-modern::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .lyrics-content-modern::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        
        .lyrics-content-modern pre {
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          line-height: 1.8;
          white-space: pre-wrap;
          color: rgba(255, 255, 255, 0.85);
          padding: 10px 5px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          letter-spacing: 0.01em;
        }
        
        /* Comments Section */
        .comments-section {
          margin-top: 10px;
        }
        
        .comment-form-container {
          margin-bottom: 25px;
        }
        
        .comment-form {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.7);
          flex-shrink: 0;
        }
        
        .comment-input-container {
          flex: 1;
          position: relative;
        }
        
        .comment-input {
          width: 100%;
          padding: 12px 16px;
          padding-right: 80px;
          background: rgba(30, 27, 44, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          color: #fff;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s ease;
        }
        
        .comment-input:focus {
          border-color: rgba(138, 43, 226, 0.5);
          box-shadow: 0 0 0 2px rgba(138, 43, 226, 0.1);
        }
        
        .comment-submit {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          padding: 6px 14px;
          border-radius: 20px;
          background: linear-gradient(90deg, #8A2BE2, #FF1493);
          color: white;
          font-size: 0.85rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .comment-submit:hover {
          transform: translateY(-50%) scale(1.05);
        }
        
        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .comment-item {
          display: flex;
          gap: 16px;
          background: rgba(30, 27, 44, 0.4);
          border-radius: 16px;
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: transform 0.2s ease;
        }
        
        .comment-item:hover {
          transform: translateY(-2px);
          background: rgba(30, 27, 44, 0.5);
        }
        
        .comment-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.9);
          flex-shrink: 0;
        }
        
        .avatar-circle {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: linear-gradient(45deg, #8A2BE2, #FF1493);
          font-weight: 600;
          font-size: 1.1rem;
        }
        
        .comment-content {
          flex: 1;
        }
        
        .comment-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        
        .comment-username {
          font-size: 0.9rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .comment-time {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .comment-text {
          font-size: 0.95rem;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 10px;
        }
        
        .comment-actions {
          display: flex;
          gap: 16px;
        }
        
        .comment-like, .comment-reply {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          cursor: pointer;
          transition: color 0.2s ease;
          padding: 0;
        }
        
        .comment-like:hover, .comment-reply:hover {
          color: rgba(255, 255, 255, 0.9);
        }
        
        /* Responsive Styles */
        @media (max-width: 900px) {
          .song-header-section {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          
          .cover-art-container {
            margin-right: 0;
            margin-bottom: 24px;
          }
          
          .song-stats {
            justify-content: center;
          }
        }
        
        @media (max-width: 768px) {
          .header {
            padding-left: 15px;
            padding-right: 15px;
          }
          
          .search-wrapper-header {
            width: 100%;
            max-width: 300px;
          }
          
          .nav-links {
            display: none;
          }
          
          .song-title-modern {
            font-size: 2rem;
          }
          
          .song-artist-modern {
            font-size: 1.1rem;
          }
          
          .cover-img-modern {
            width: 180px;
            height: 180px;
          }
          
          .content-tabs {
            overflow-x: auto;
            padding-bottom: 5px;
            scrollbar-width: none;
          }
          
          .content-tabs::-webkit-scrollbar {
            display: none;
          }
          
          .lyrics-section-modern {
            padding: 20px 15px;
          }
          
          .lyrics-content-modern pre {
            font-size: 0.9rem;
          }
        }
        
        @media (max-width: 480px) {
          .song-title-modern {
            font-size: 1.8rem;
          }
          
          .tab {
            padding: 6px 12px;
            font-size: 0.85rem;
          }
          
          .comment-form {
            flex-direction: column;
          }
          
          .user-avatar {
            display: none;
          }
          
          .lyrics-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .lyrics-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </>
  );
}
        