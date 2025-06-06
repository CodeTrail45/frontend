// File: pages/loading.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

function sanitizeParam(str) {
  return str.replace(/[\/\?\#\\]/g, '_').trim();
}

export default function LoadingPage() {
  const router = useRouter();
  const { artist, track } = router.query;

  useEffect(() => {
    if (artist && track) {
      const a = sanitizeParam(String(artist));
      const t = sanitizeParam(String(track));
      const timer = setTimeout(() => {
        router.replace(`/songs/${a}/${t}`);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [artist, track, router]);

  return (
    <>
      <Head>
        <title>Loading – Scalpel</title>
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
          <div className="header-right">
            <a href="https://www.instagram.com/medicine.boxx" target="_blank" rel="noopener noreferrer" className="icon-link">
              <img src="/676d86456b8d7df0ad9dfbbc_instagram-p-500.png" alt="Instagram" className="icon-img" />
            </a>
            <a href="https://www.tiktok.com/@medicine_box" target="_blank" rel="noopener noreferrer" className="icon-link">
              <img src="/676d8645748a7a3f311b4eca_tiktok-p-500.png" alt="TikTok" className="icon-img" />
            </a>
          </div>
        </header>
        <main className="main-content dark-main">
          <div className="pulse-loader"></div>
          <div className="loading-text">Loading analysis...</div>
        </main>
      </div>
      <style jsx>{`
        .dark-bg {
          background: linear-gradient(135deg,rgb(71, 66, 99),rgb(52, 46, 79),rgb(14, 13, 21));
          min-height: 100vh;
        }
        .page-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', 'Poppins', sans-serif;
          overflow-x: hidden;
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
        .main-content.dark-main {
          margin-top: calc(70px + env(safe-area-inset-top));
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
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
          color: #fff;
          font-weight: 500;
          letter-spacing: 0.5px;
        }
      `}</style>
    </>
  );
}
