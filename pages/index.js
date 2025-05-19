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
        title: "Kevin’s Heart",
        artist_names: "J. Cole",
        cover_art: "https://images.genius.com/289a05fcbb77ebd0aecd2b221a613fe2.1000x1000x1.png"
        }
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
        title: "Don’t Stop Me Now",
        artist_names: "Queen",
        cover_art: "https://images.genius.com/aface99ac22323aec35a2841f57af5c1.600x595x1.jpg"
      }
    ]);
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
              <span className="nav-link" onClick={() => alert('About page coming soon!')}>About</span>
            </div>
          </div>
          {/* <div className="search-wrapper-header" ref={searchWrapperRef}>
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
          </div> */}
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
          background: linear-gradient(135deg,rgb(51, 46, 78),rgb(40, 36, 58), #13111C);
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
          background: rgba(62, 58, 75, 0.85);
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
        }
        .section-row {
          margin-bottom: 10px;
        }
        .section-row h2 {
          font-size: 1.2rem;
          margin-bottom: 10px;
          color: #bbd;
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
