import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [trending, setTrending] = useState([]);
  const [mostViewed, setMostViewed] = useState([]);
  const [mostDiscussed, setMostDiscussed] = useState([]);
  const searchWrapperRef = useRef(null);

  // 1) Search suggestions
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
    // fetch trending
    fetch('/api/trending')
      .then((r) => r.json())
      .then((data) => setTrending(data.trending || []))
      .catch(console.error);

    // fetch most viewed
    fetch('/api/mostViewed')
      .then((r) => r.json())
      .then((data) => setMostViewed(data.results || []))
      .catch(console.error);

    // fetch most discussed
    fetch('/api/mostDiscussed')
      .then((r) => r.json())
      .then((data) => setMostDiscussed(data.results || []))
      .catch(console.error);
  }, []);

  // Checking if analysis exists => skip loading if it does
  async function checkAnalysisExists(artist, track) {
    try {
      const res = await fetch(
        `/api/analysisCheck?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`
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
      const parts = query.split('-');
      if (parts.length === 2) {
        const artist = parts[0].trim();
        const track = parts[1].trim();
        const exists = await checkAnalysisExists(artist, track);
        if (exists) {
          router.push(`/songs/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`);
        } else {
          router.push(`/loading?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`);
        }
      } else {
        alert('Use the format "Artist - Track".');
      }
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

  return (
    <>
      <Head>
        <title>Scalpel</title>
        <meta name="description" content="Search for song analysis at Scalpel" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="page-container">
        <header className="header">
          <div className="header-left">
            <span className="nav-link" onClick={() => alert('About page coming soon!')}>
              About
            </span>
            <img
              src="/logo2.png"
              alt="Scalpel Logo"
              className="header-logo"
              onClick={() => router.push('/')}
            />
          </div>
          <div className="header-right">
            <a
              href="https://www.instagram.com/medicine.boxx"
              target="_blank"
              rel="noopener noreferrer"
              className="icon-link"
            >
              <img src="/676d86456b8d7df0ad9dfbbc_instagram-p-500.png" alt="IG" className="icon-img" />
            </a>
            <a
              href="https://www.tiktok.com/@medicine_box"
              target="_blank"
              rel="noopener noreferrer"
              className="icon-link"
            >
              <img src="/676d8645748a7a3f311b4eca_tiktok-p-500.png" alt="TikTok" className="icon-img" />
            </a>
          </div>
        </header>

        <div className="main-hero">
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
                    onClick={() => handleSongClick(row.artist, row.track)}
                  >
                    <div className="cover-wrapper">
                      {row.cover_art ? (
                        <img src={row.cover_art} alt="Cover" className="cover-img" />
                      ) : (
                        <div className="cover-img placeholder" />
                      )}
                    </div>
                    <p className="song-title">{row.track}</p>
                    <p className="song-artist">{row.artist}</p>
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
                    onClick={() => handleSongClick(row.artist, row.track)}
                  >
                    <div className="cover-wrapper">
                      {row.cover_art ? (
                        <img src={row.cover_art} alt="Cover" className="cover-img" />
                      ) : (
                        <div className="cover-img placeholder" />
                      )}
                    </div>
                    <p className="song-title">{row.track}</p>
                    <p className="song-artist">{row.artist}</p>
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
                    onClick={() => handleSongClick(row.artist, row.track)}
                  >
                    <div className="cover-wrapper">
                      {row.cover_art ? (
                        <img src={row.cover_art} alt="Cover" className="cover-img" />
                      ) : (
                        <div className="cover-img placeholder" />
                      )}
                    </div>
                    <p className="song-title">{row.track}</p>
                    <p className="song-artist">{row.artist}</p>
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
        /* Full page container */
        .page-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #fff;
          font-family: 'Poppins', sans-serif;
        }
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: calc(60px + env(safe-area-inset-top));
          padding-top: env(safe-area-inset-top);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-left: 20px;
          padding-right: 20px;
          border-bottom: 1px solid #ddd;
          background: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          z-index: 1000;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .nav-link {
          font-size: 0.9rem;
          color: #666;
          cursor: pointer;
        }
        .header-logo {
          height: 40px;
          width: auto;
          cursor: pointer;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .icon-link {
          display: flex;
          align-items: center;
        }
        .icon-img {
          width: 24px;
          height: 24px;
        }

        .main-hero {
          margin-top: calc(60px + env(safe-area-inset-top));
          flex: 1;
          padding: 20px;
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
        .suggestions-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          max-height: 250px;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 100;
        }
        .suggestion-item {
          display: flex;
          align-items: center;
          padding: 10px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
        }
        .suggestion-item:hover {
          background-color: #f8f8f8;
        }
        .suggestion-cover {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 4px;
          margin-right: 10px;
        }
        .browse-sections {
          width: 100%;
        }
        .section-row {
          margin-bottom: 10px;
        }
        .section-row h2 {
          font-size: 1.2rem;
          margin-bottom: 10px;
          color: #333;
        }
        .horiz-scroll {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 10px;

          /* NEW LINES */
          padding-right: 60px; /* Increase if you want more partial display */
          margin-right: -60px; /* Must match padding-right */
        }
        .horiz-scroll::-webkit-scrollbar {
          height: 8px;
        }
        .horiz-scroll::-webkit-scrollbar-thumb {
          background-color: #ccc;
          border-radius: 4px;
        }
        .song-card {
          flex: 0 0 auto;
          width: 120px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .cover-wrapper {
          width: 100%;
          height: 120px;
          background: #f2f2f2;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;

          /* NEW LINE */
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
      `}</style>
    </>
  );
}
