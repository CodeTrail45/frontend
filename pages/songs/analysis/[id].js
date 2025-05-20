import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { API_ENDPOINTS } from '../../../constants';

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
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentUpvotes, setCommentUpvotes] = useState({});
  const [userUpvotes, setUserUpvotes] = useState({});
  const [activeSection, setActiveSection] = useState('lyrics');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authForm, setAuthForm] = useState({
    username: '',
    password: ''
  });
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!id || !title || !artist) return;
    setLoading(true);
    // Get cover art from search_lyrics for this id
    fetch(`${API_ENDPOINTS.SEARCH_LYRICS}?track_name=${encodeURIComponent(title)}`)
      .then((res) => res.json())
      .then((data) => {
        const found = (data.results || []).find((s) => String(s.id) === String(id));
        if (found) setCoverArt(found.cover_art);
      });
    // Get analysis and lyrics
    fetch(`${API_ENDPOINTS.ANALYZE_LYRICS}?record_id=${encodeURIComponent(id)}&track=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`)
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

  // Fetch comments when song ID is available
  useEffect(() => {
    if (!id) return;
    fetch(`${API_ENDPOINTS.COMMENTS}/${id}`)
      .then((res) => res.json())
      .then((data) => {
        // Ensure data is an array
        setComments(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Error fetching comments:', err);
        setComments([]); // Set empty array on error
      });
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;

    try {
      const response = await fetch(API_ENDPOINTS.COMMENTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: newComment.trim(),
          song_id: id
        })
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments([newCommentData, ...comments]);
        setNewComment('');
      } else {
        console.error('Failed to post comment');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.COMMENTS}/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      if (response.ok) {
        // Remove comment from the UI
        setComments(comments.filter(comment => comment.id !== commentId));
      } else {
        const errorData = await response.json();
        console.error('Failed to delete comment:', errorData);
        alert('Cannot delete this comment. ' + (errorData.detail || ''));
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('An error occurred while deleting the comment.');
    }
  }

  const handleUpvoteComment = async (commentId) => {
    // Check if user has already upvoted this comment
    if (userUpvotes[commentId]) {
      // User has already upvoted this comment
      alert('You have already upvoted this comment');
      return;
    }
  
    try {
      const response = await fetch(`${API_ENDPOINTS.COMMENTS}/${commentId}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      if (response.ok) {
        const data = await response.json();
        
        // Update the local upvote count
        setCommentUpvotes(prev => ({
          ...prev,
          [commentId]: (prev[commentId] || 0) + 1
        }));
        
        // Save to userUpvotes state and localStorage to prevent multiple upvotes
        const updatedUpvotes = { ...userUpvotes, [commentId]: true };
        setUserUpvotes(updatedUpvotes);
        localStorage.setItem('userUpvotes', JSON.stringify(updatedUpvotes));
        
        // Check if the comment has reached 10 upvotes
        if ((commentUpvotes[commentId] || 0) + 1 >= 10) {
          // Get the current analysis data using the same API endpoint as in useEffect
          const analysisResponse = await fetch(
            `${API_ENDPOINTS.ANALYZE_LYRICS}?record_id=${encodeURIComponent(id)}&track=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
          );
          
          const analysisData = await analysisResponse.json();
          
          // Trigger re-analyze API with the correct body format
          fetch(API_ENDPOINTS.RE_ANALYZE, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              oldAnalysis: {
                overallHeadline: analysisData.analysis.overallHeadline,
                songTitle: analysisData.analysis.songTitle,
                artist: analysisData.analysis.artist,
                introduction: analysisData.analysis.introduction,
                sectionAnalyses: analysisData.analysis.sectionAnalyses,
                conclusion: analysisData.analysis.conclusion
              },
              newComment: comments.find(c => c.id === commentId)?.content || '',
              artist: artist,
              track: title
            })
          });
        }
      } else {
        console.error('Failed to upvote comment');
      }
    } catch (err) {
      console.error('Error upvoting comment:', err);
    }
  };
  useEffect(() => {
    // Load previously upvoted comments from localStorage
    const savedUpvotes = localStorage.getItem('userUpvotes');
    if (savedUpvotes) {
      setUserUpvotes(JSON.parse(savedUpvotes));
    }
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
    // Get the user ID when component mounts
    if (token) {
      // Fetch user info to get ID if you have an endpoint for it
      fetch(`${API_ENDPOINTS.USER}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        localStorage.setItem('userId', data.id);
      })
      .catch(err => {
        console.error('Error fetching user info:', err);
      });
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');

    try {
      const response = await fetch(API_ENDPOINTS.AUTH[authMode === 'login' ? 'LOGIN' : 'REGISTER'], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authForm)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        setIsLoggedIn(true);
        setShowAuthModal(false);
        setAuthForm({ username: '', password: '' });
      } else {
        setAuthError(data.detail || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('An error occurred. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  return (
    <>
      <Head>
        <title>{title ? `${title} by ${artist} | Scalpel` : 'Song Analysis | Scalpel'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
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
            {isLoggedIn ? (
              <button className="auth-button logout" onClick={handleLogout}>
                Logout
              </button>
            ) : (
              <button className="auth-button login" onClick={() => {
                setAuthMode('login');
                setShowAuthModal(true);
              }}>
                Login
              </button>
            )}
            <a href="https://www.instagram.com/medicine.boxx" target="_blank" rel="noopener noreferrer" className="icon-link">
              <img src="/676d86456b8d7df0ad9dfbbc_instagram-p-500.png" alt="Instagram" className="icon-img" />
            </a>
            <a href="https://www.tiktok.com/@medicine_box" target="_blank" rel="noopener noreferrer" className="icon-link">
              <img src="/676d8645748a7a3f311b4eca_tiktok-p-500.png" alt="TikTok" className="icon-img" />
            </a>
          </div>
        </header>

        {/* Auth Modal */}
        {showAuthModal && (
          <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
            <div className="auth-modal" onClick={e => e.stopPropagation()}>
              <div className="auth-modal-header">
                <h2>{authMode === 'login' ? 'Login' : 'Sign Up'}</h2>
                <button className="close-button" onClick={() => setShowAuthModal(false)}>×</button>
              </div>
              <form onSubmit={handleAuth} className="auth-form">
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    value={authForm.username}
                    onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    required
                  />
                </div>
                {authError && <div className="auth-error">{authError}</div>}
                <button type="submit" className="auth-submit">
                  {authMode === 'login' ? 'Login' : 'Sign Up'}
                </button>
                <div className="auth-switch">
                  {authMode === 'login' ? (
                    <p>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setAuthMode('signup')}
                        className="switch-button"
                      >
                        Sign Up
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        className="switch-button"
                      >
                        Login
                      </button>
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

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
                      {comments.map((comment) => {
                        // Get stored user ID to check if comment belongs to current user
                        const currentUserId = localStorage.getItem('userId');
                        const isCommentOwner = currentUserId && currentUserId === String(comment.user_id);
                        
                        return (
                          <div key={comment.id} className="comment-block">
                            <div className="comment-avatar">
                              <div className="avatar-circle">
                                {isLoggedIn && comment.user?.username 
                                  ? comment.user.username[0].toUpperCase() 
                                  : 'U'}
                              </div>
                            </div>
                            <div className="comment-content">
                              <div className="comment-header">
                                <span className="comment-username">
                                  {comment.user?.username || 'User'}
                                </span>
                                <span className="comment-time">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                                {isCommentOwner && (
                                  <button 
                                    className="delete-button" 
                                    onClick={() => handleDeleteComment(comment.id)}
                                    aria-label="Delete comment"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M3 6h18"></path>
                                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                                      <line x1="10" y1="11" x2="10" y2="17"></line>
                                      <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                  </button>
                                )}
                              </div>
                              <p className="comment-text">{comment.content}</p>
                              <div className="comment-actions">
                                <button 
                                  className={`comment-action upvote ${userUpvotes[comment.id] ? 'upvoted' : ''}`}
                                  onClick={() => handleUpvoteComment(comment.id)}
                                  disabled={userUpvotes[comment.id]}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"></path>
                                    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                  </svg>
                                  <span>{commentUpvotes[comment.id] || 0}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
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

        .comment-action.upvoted {
          color: #8A2BE2;
          pointer-events: none;
        }

        .comment-action.upvoted svg {
          fill: rgba(138, 43, 226, 0.2);
          stroke: #8A2BE2;
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

        .delete-button {
          background: none;
          border: none;
          padding: 4px;
          margin-left: auto;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .delete-button:hover {
          background: rgba(255, 20, 147, 0.15);
          color: #FF1493;
          transform: scale(1.1);
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
          gap: 8px;
          margin-left: auto;
        }
        
        .comment-action {
          display: flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          cursor: pointer;
          transition: color 0.2s ease;
          padding: 4px 8px;
          border-radius: 12px;
        }
        
        .comment-action:hover {
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.05);
        }
        
        .comment-action.upvote:hover {
          color: #8A2BE2;
        }
        
        .comment-action.delete:hover {
          color: #FF1493;
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

        .auth-button {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          margin-right: 15px;
        }

        .auth-button.login {
          background: linear-gradient(90deg, #8A2BE2, #FF1493);
          color: white;
        }

        .auth-button.logout {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .auth-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .auth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(5px);
        }

        .auth-modal {
          background: rgba(30, 27, 44, 0.95);
          border-radius: 16px;
          padding: 30px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .auth-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .auth-modal-header h2 {
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .close-button {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }

        .form-group input {
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: white;
          font-size: 1rem;
        }

        .form-group input:focus {
          outline: none;
          border-color: #8A2BE2;
          box-shadow: 0 0 0 2px rgba(138, 43, 226, 0.2);
        }

        .auth-error {
          color: #ff4444;
          font-size: 0.9rem;
          text-align: center;
        }

        .auth-submit {
          padding: 12px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(90deg, #8A2BE2, #FF1493);
          color: white;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .auth-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .auth-switch {
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }

        .switch-button {
          background: none;
          border: none;
          color: #8A2BE2;
          cursor: pointer;
          font-weight: 500;
          padding: 0;
        }

        .switch-button:hover {
          text-decoration: underline;
        }
      `}</style>
    </>
  );
}
        