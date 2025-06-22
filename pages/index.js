import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { BASE_URL } from '../constants';

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [trending, setTrending] = useState([]);
  const [mostViewed, setMostViewed] = useState([]);
  const [mostDiscussed, setMostDiscussed] = useState([]);
  const searchWrapperRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');

  // --- NAVBAR SEARCH BAR STATE (copied from [id].js) ---
  const [navQuery, setNavQuery] = useState('');
  const [navSuggestions, setNavSuggestions] = useState([]);
  const [navShowSuggestions, setNavShowSuggestions] = useState(false);
  const navSearchWrapperRef = useRef(null);

  // 1) Search suggestions
  useEffect(() => {
    if (query.trim().length > 0) {
      const timer = setTimeout(() => {
        fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(query.trim())}`)
          .then((res) => res.json())
          .then((data) => {
            setSuggestions(data.results || []);
            setShowSuggestions(true);
          })
          .catch((err) => {
            console.error('Error fetching suggestions:', err);
            setSuggestions([]);
          });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  // 2) Close suggestions if user clicks outside
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

  // 3) Fetch categories
  useEffect(() => {
    // Hardcoded songs for demo
    setTrending([
      {
        id: 1063,
        title: "Bohemian Rhapsody",
        artist_names: "Queen",
        cover_art: "https://images.genius.com/718de9d1fbcaae9f3c9b1bf483bfa8f1.1000x1000x1.png"
      },
      {
        id: 122476,
        title: "Total Eclipse of the Heart",
        artist_names: "Bonnie Tyler",
        cover_art: "https://images.genius.com/7696e1d75ca17ac6ed6b6334e59401ba.600x600x1.jpg"
      },
      {
        id: 10024512,
        title: "I Can Do It With a Broken Heart",
        artist_names: "Taylor Swift",
        cover_art: "https://images.genius.com/ffbac9cc7a380db1d09d5895dcc63a44.1000x1000x1.png"
      },
      {
        id: 299177,
        title: "Drunk in Love",
        artist_names: "Beyoncé (Ft. JAY-Z)",
        cover_art: "https://images.genius.com/822e0619fe28f3e35aba4eba567111e8.1000x1000x1.png"
        },
      {
        id: 2263909,
        title: "i hate u, i love u",
        artist_names: "gnash (Ft. Olivia O'Brien)",
        cover_art: "https://images.genius.com/40fcc6f11d0fcedfd4b21789c41af8db.1000x1000x1.png"
      },
      {
        id: 2342329,
        title: "Love Yourself",
        artist_names: "Justin Bieber",
        cover_art: "https://images.genius.com/c48eb30caab693c9a80f49610e2ddb24.1000x1000x1.png"
      },
      {
        id: 92464,
        title: "Love Sosa",
        artist_names: "Chief Keef",
        cover_art: "https://images.genius.com/45653129f1bada90a3803e0abd3e04e7.800x800x1.png"
      },
      {
        id: 3422526,
        title: "lovely",
        artist_names: "Billie Eilish & Khalid",
        cover_art: "https://images.genius.com/0a59a8c2c66bb9b588c5f68d9f7acd22.1000x1000x1.png"
      },
      {
        id: 3182605,
        title: "Fuck Love",
        artist_names: "XXXTENTACION (Ft. Trippie Redd)",
        cover_art: "https://images.genius.com/3909b41f2c27e688e4caec3637cdba36.1000x1000x1.png"
      },
      {
        id: 6419329,
        title: "Gone",
        artist_names: "ROSÉ",
        cover_art: "https://images.genius.com/e8a9c7c30efdb765f5a8428364f0a895.1000x1000x1.png"
      },
      {
        id: 191,
        title: "Big Poppa",
        artist_names: "The Notorious B.I.G.",
        cover_art: "https://images.genius.com/514706123e1556e4d0c33474516ec2f3.1000x1000x1.png"
      },
      {
        id: 570825,
        title: "No Flockin",
        artist_names: "Kodak Black",
        cover_art: "https://images.genius.com/cee9f34bdb116b81d4b60b0b207fee62.1000x1000x1.png"
      }
    ]);
    setMostViewed([
      {
        id: 2236,
        title: "Yesterday",
        artist_names: "The Beatles",
        cover_art: "https://images.genius.com/f9bfd62a8c651caab16f631039a9a0b6.600x600x1.jpg"
      },
      {
        id: 3660088,
        title: "Kevin's Heart",
        artist_names: "J. Cole",
        cover_art: "https://images.genius.com/289a05fcbb77ebd0aecd2b221a613fe2.1000x1000x1.png"
      },
      {
        id: 3182605,
        title: "Fuck Love",
        artist_names: "XXXTENTACION (Ft. Trippie Redd)",
        cover_art: "https://images.genius.com/3909b41f2c27e688e4caec3637cdba36.1000x1000x1.png"
      },
      {
        id: 6419329,
        title: "Gone",
        artist_names: "ROSÉ",
        cover_art: "https://images.genius.com/e8a9c7c30efdb765f5a8428364f0a895.1000x1000x1.png"
      },
      {
        id: 299177,
        title: "Drunk in Love",
        artist_names: "Beyoncé (Ft. JAY-Z)",
        cover_art: "https://images.genius.com/822e0619fe28f3e35aba4eba567111e8.1000x1000x1.png"
      },
      {
            "id": 43,
            "title": "Juicy",
            "artist_names": "The Notorious B.I.G.",
            "cover_art": "https://images.genius.com/0dcf916a5c93169e88b27c378d58742e.1000x1000x1.png"
        },
        {
          id: 711649,
          title: "ULTIMATE",
          artist_names: "Denzel Curry",
          cover_art: "https://images.genius.com/e6278593a52eb5369b6ce6306ae494c1.1000x1000x1.png"
        },
    ]);
    setMostDiscussed([
      {
        id: 2419257,
        title: "Formation",
        artist_names: "Beyoncé",
        cover_art: "https://images.genius.com/4a477a266a1de166f4e1e3ac714f474c.1000x1000x1.png"
      },
      {
        id: 205311,
        title: "Don't Stop Me Now",
        artist_names: "Queen",
        cover_art: "https://images.genius.com/aface99ac22323aec35a2841f57af5c1.600x595x1.jpg"
      },
      {
        id: 92464,
        title: "Love Sosa",
        artist_names: "Chief Keef",
        cover_art: "https://images.genius.com/45653129f1bada90a3803e0abd3e04e7.800x800x1.png"
      },
      {
        id: 3422526,
        title: "lovely",
        artist_names: "Billie Eilish & Khalid",
        cover_art: "https://images.genius.com/0a59a8c2c66bb9b588c5f68d9f7acd22.1000x1000x1.png"
      },
      {
        id: 3182605,
        title: "Fuck Love",
        artist_names: "XXXTENTACION (Ft. Trippie Redd)",
        cover_art: "https://images.genius.com/3909b41f2c27e688e4caec3637cdba36.1000x1000x1.png"
      },
      {
        id: 191,
        title: "Big Poppa",
        artist_names: "The Notorious B.I.G.",
        cover_art: "https://images.genius.com/514706123e1556e4d0c33474516ec2f3.1000x1000x1.png"
      },
      {
        id: 570825,
        title: "No Flockin",
        artist_names: "Kodak Black",
        cover_art: "https://images.genius.com/cee9f34bdb116b81d4b60b0b207fee62.1000x1000x1.png"
      }
    ]);
  }, []);

  // Check token on mount and on every focus
  useEffect(() => {
    function checkToken() {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoggedIn(false);
        return;
      }
      // Check expiry if JWT
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          localStorage.removeItem('token');
          setIsLoggedIn(false);
          return;
        }
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(true);
      }
    }
    checkToken();
    window.addEventListener('focus', checkToken);
    return () => window.removeEventListener('focus', checkToken);
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  }

  async function handleAuth(e) {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await fetch(`${BASE_URL}/api/auth/${authMode === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    } catch {
      setAuthError('An error occurred. Please try again.');
    }
  }

  // Checking if analysis exists => skip loading if it does
  async function checkAnalysisExists(artist, track) {
    try {
      const res = await fetch(
        `${BASE_URL}/api/analysisCheck?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`
      );
      const data = await res.json();
      return data.exists || false;
    } catch (err) {
      console.error('Error checking analysis existence:', err);
      return false;
    }
  }

  // Searching => "Artist - Track" format
  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/searchresults?track_name=${encodeURIComponent(query.trim())}`);
    }
  };

  // On suggestion click
  const handleSuggestionClick = async (item) => {
    const artist = item.artist_names;
    const track = item.title;
    const exists = await checkAnalysisExists(artist, track);
    if (exists) {
      router.push(`/songs/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`);
    } else {
      router.push(`/loading?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`);
    }
  };

  // Click a row
  const handleSongClick = (artist, track) => {
    router.push(`/songs/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`);
  };

  // Suggestions logic (identical to [id].js)
  useEffect(() => {
    if (navQuery.trim().length > 0) {
      const timer = setTimeout(() => {
        fetch(`${BASE_URL}/search_lyrics?track_name=${encodeURIComponent(navQuery.trim())}`)
          .then((res) => res.json())
          .then((data) => {
            setNavSuggestions(data.results || []);
            setNavShowSuggestions(true);
          })
          .catch(() => {
            setNavSuggestions([]);
          });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setNavSuggestions([]);
      setNavShowSuggestions(false);
    }
  }, [navQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        navSearchWrapperRef.current &&
        !navSearchWrapperRef.current.contains(e.target)
      ) {
        setNavShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavSearch = (e) => {
    e.preventDefault();
    if (navQuery.trim()) {
      router.push(`/searchresults?track_name=${encodeURIComponent(navQuery.trim())}`);
    }
  };

  const handleNavSuggestionClick = (item) => {
    setNavQuery(item.title);
    setNavShowSuggestions(false);
    router.push(`/searchresults?track_name=${encodeURIComponent(item.title)}`);
  };

  return (
    <>
      <Head>
        <title>Scalpel</title>
        <meta name="description" content="Search for song analysis at Scalpel" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="page-container dark-bg">
        <header className="header">
          <div className="header-left">
            <img src="/logo2.png" alt="Scalpel Logo" className="header-logo" onClick={() => router.push('/')} />
            <div className="nav-links">
              <span className="nav-link" onClick={() => router.push('/')}>Home</span>
              <span className="nav-link" onClick={() => alert('About page coming soon!')}>About</span>
              <span className="nav-link" onClick={() => alert('Charts page coming soon!')}>Charts</span>
            </div>
          </div>
          <div className="search-wrapper-header" ref={navSearchWrapperRef}>
            <form onSubmit={handleNavSearch} className="search-form-header">
              <div className="search-input-wrapper-header">
                <span className="search-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#777" viewBox="0 0 24 24">
                    <path d="M21.707 20.293l-5.387-5.387a7.5 7.5 0 10-1.414 1.414l5.387 5.387a1 1 0 001.414-1.414zM10.5 16a5.5 5.5 0 110-11 5.5 5.5 0 010 11z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search songs..."
                  value={navQuery}
                  onChange={(e) => setNavQuery(e.target.value)}
                  onFocus={() => {
                    if (navQuery.trim().length > 2) setNavShowSuggestions(true);
                  }}
                />
              </div>
            </form>
            {navShowSuggestions && navSuggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {navSuggestions.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="suggestion-item"
                    onClick={() => handleNavSuggestionClick(s)}
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

        <div className="main-hero dark-main">
          <img
            src="/logo2.png"
            alt="Scalpel Logo"
            className="hero-logo"
            onClick={() => router.push('/')}
          />

          <div className="search-wrapper" ref={searchWrapperRef}>
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-wrapper">
                <span className="search-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    fill="#999"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21.707 20.293l-5.387-5.387a7.5 7.5 0 10-1.414 1.414l5.387 5.387a1 1 0 001.414-1.414zM10.5 16a5.5 5.5 0 110-11 5.5 5.5 0 010 11z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search"
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

          {/* Three categories */}
          <div className="browse-sections">
            <section className="section-row">
              <h2>Trending Searches</h2>
              <div className="horiz-scroll">
                {trending.map((row, i) => (
                  <div
                    key={`${row.artist}-${row.track}-${i}`}
                    className="song-card"
                    onClick={() => router.push(`/songs/analysis/${row.id}?title=${encodeURIComponent(row.title)}&artist=${encodeURIComponent(row.artist_names)}`)}
                  >
                    <div className="cover-wrapper">
                      {row.cover_art ? (
                        <img src={row.cover_art} alt="Cover" className="cover-img" />
                      ) : (
                        <div className="cover-img placeholder" />
                      )}
                    </div>
                    <p className="song-title">{row.track}</p>
                    <p className="song-artist">{row.artist_names}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="section-row">
              <h2>Most Viewed All Time</h2>
              <div className="horiz-scroll">
                {mostViewed.map((row, i) => (
                  <div
                    key={`${row.artist}-${row.track}-${i}`}
                    className="song-card"
                    onClick={() => router.push(`/songs/analysis/${row.id}?title=${encodeURIComponent(row.title)}&artist=${encodeURIComponent(row.artist_names)}`)}
                  >
                    <div className="cover-wrapper">
                      {row.cover_art ? (
                        <img src={row.cover_art} alt="Cover" className="cover-img" />
                      ) : (
                        <div className="cover-img placeholder" />
                      )}
                    </div>
                    <p className="song-title">{row.track}</p>
                    <p className="song-artist">{row.artist_names}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="section-row">
              <h2>Most Discussed</h2>
              <div className="horiz-scroll">
                {mostDiscussed.map((row, i) => (
                  <div
                    key={`${row.artist}-${row.track}-${i}`}
                    className="song-card"
                    onClick={() => router.push(`/songs/analysis/${row.id}?title=${encodeURIComponent(row.title)}&artist=${encodeURIComponent(row.artist_names)}`)}
                  >
                    <div className="cover-wrapper">
                      {row.cover_art ? (
                        <img src={row.cover_art} alt="Cover" className="cover-img" />
                      ) : (
                        <div className="cover-img placeholder" />
                      )}
                    </div>
                    <p className="song-title">{row.track}</p>
                    <p className="song-artist">{row.artist_names}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <footer className="footer">
          <p>© {new Date().getFullYear()} Scalpel. All rights reserved.</p>
        </footer>
      </div>

      <style jsx>{`
        .dark-bg {
          background: linear-gradient(135deg, rgb(120, 116, 146), rgb(52, 46, 79), rgb(164, 37, 130));
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }
        .dark-bg::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 0;
          background: radial-gradient(circle at 20% 30%, rgba(255, 20, 147, 0.12) 0, transparent 60%),
                      radial-gradient(circle at 80% 70%, rgba(138, 43, 226, 0.10) 0, transparent 60%);
          pointer-events: none;
          animation: bg-move 12s ease-in-out infinite alternate;
        }
        @keyframes bg-move {
          0% {
            background-position: 20% 30%, 80% 70%;
          }
          100% {
            background-position: 30% 40%, 70% 60%;
          }
        }
        .page-container {
          position: relative;
          z-index: 1;
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
          background: rgba(106, 103, 116, 0.85);
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          z-index: 1000;
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
          color: rgba(248, 242, 242, 0.5);
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
        .dark-main {
          margin-top: calc(70px + env(safe-area-inset-top));
          flex: 1;
          padding: 30px 20px;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
        }
        .hero-logo {
          display: block;
          height: 80px;
          width: auto;
          margin: 0 auto 20px auto;
          cursor: pointer;
        }
        .search-wrapper {
          position: relative;
          width: 100%;
          margin-bottom: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .search-form {
          width: 100%;
        }
        .search-input-wrapper {
          position: relative;
          width: 100%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-radius: 24px;
        }
        .search-icon {
          position: absolute;
          top: 50%;
          left: 14px;
          transform: translateY(-50%);
        }
        .search-form input {
          width: 100%;
          padding: 14px 18px 14px 40px;
          font-size: 1rem;
          border: none;
          border-radius: 24px;
          outline: none;
        }
        .browse-sections {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .section-row {
          margin-bottom: 40px;
        }
        .section-row h2 {
          font-size: 1.2rem;
          margin-bottom: 20px;
          color: #bbd;
        }
        .horiz-scroll {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 20px;
          width: 100%;
        }
        .song-card {
          width: 100%;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .cover-wrapper {
          width: 100%;
          aspect-ratio: 1;
          background: #f2f2f2;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
        }
        .cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .placeholder {
          background: #eee;
        }
        .song-title {
          margin: 8px 0 0 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: #333;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.2;
        }
        .song-artist {
          margin: 2px 0 0 0;
          font-size: 0.75rem;
          color: #777;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.2;
        }
        .footer {
          text-align: center;
          font-size: 0.9rem;
          color: #999;
          padding: 10px 0;
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
