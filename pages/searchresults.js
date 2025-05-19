import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';

export default function SearchResults() {
  const router = useRouter();
  const { track_name } = router.query;
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(track_name || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapperRef = useRef(null);

  useEffect(() => {
    if (!track_name) return;
    setLoading(true);
    fetch(`http://localhost:8000/search_lyrics?track_name=${encodeURIComponent(track_name)}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data.results || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [track_name]);

  // Suggestions logic (copied from index.js)
  useEffect(() => {
    if (query.trim().length > 2) {
      const timer = setTimeout(() => {
        fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
          .then((res) => res.json())
          .then((data) => {
            setSuggestions(data.results || []);
            setShowSuggestions(true);
          })
          .catch((err) => {
            setSuggestions([]);
          });
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

  const handleSongClick = (song) => {
    router.push(`/songs/analysis/${song.id}?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist_names)}`);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Search Results – Scalpel</title>
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
              <span className="nav-link" onClick={() => alert('About page coming soon!')}>About</span>
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
          <div className="header-right">
            <a href="https://www.instagram.com/medicine.boxx" target="_blank" rel="noopener noreferrer" className="icon-link">
              <img src="/676d86456b8d7df0ad9dfbbc_instagram-p-500.png" alt="Instagram" className="icon-img" />
            </a>
            <a href="https://www.tiktok.com/@medicine_box" target="_blank" rel="noopener noreferrer" className="icon-link">
              <img src="/676d8645748a7a3f311b4eca_tiktok-p-500.png" alt="TikTok" className="icon-img" />
            </a>
          </div>
        </header>
        <div className="main-hero dark-main">
          <div className="search-results-page">
            <div className="results-grid">
              {results.map((song) => (
                <div className="song-card-mini" key={song.id} onClick={() => handleSongClick(song)} style={{ cursor: 'pointer' }}>
                  <div className="cover-wrapper-mini">
                    <img src={song.cover_art} alt={song.title} className="cover-img-mini" />
                  </div>
                  <div className="song-title-mini">{song.title}</div>
                  <div className="song-artist-mini">{song.artist_names}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .dark-bg {
          background: linear-gradient(135deg, #13111C, #1e1b2c, #292541);
          min-height: 100vh;
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
        .dark-main {
          margin-top: calc(70px + env(safe-area-inset-top));
          flex: 1;
          padding: 30px 20px;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
        }
        .search-results-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 40px 0;
        }
        .results-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 32px;
          justify-content: center;
          width: 100%;
          max-width: 900px;
        }
        .song-card-mini {
          width: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(30, 27, 44, 0.6);
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          padding: 16px 8px 12px 8px;
          transition: box-shadow 0.2s;
        }
        .song-card-mini:hover {
          box-shadow: 0 6px 18px rgba(0,0,0,0.13);
        }
        .cover-wrapper-mini {
          width: 120px;
          height: 120px;
          border-radius: 8px;
          overflow: hidden;
          background: #2c2a3a;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }
        .cover-img-mini {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .song-title-mini {
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 2px;
          text-align: center;
          line-height: 1.2;
        }
        .song-artist-mini {
          font-size: 0.85rem;
          color: #b19cd9;
          text-align: center;
        }
      `}</style>
    </>
  );
} 