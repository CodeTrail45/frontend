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
      </Head>
      <div className="page-container">
        <header className="header">
          <div className="header-left">
            <span className="nav-link" onClick={() => alert('About page coming soon!')}>About</span>
            <img src="/logo2.png" alt="Scalpel Logo" className="header-logo" onClick={() => router.push('/')} />
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

        <main className="main-content">
          <div className="spinner-ring">
            <div />
            <div />
            <div />
            <div />
          </div>
          <p className="loading-text">Loading analysis...</p>
        </main>

        <footer className="footer">
          <p>© {new Date().getFullYear()} Scalpel. All rights reserved.</p>
        </footer>
      </div>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #fff;
          font-family: 'Poppins', sans-serif;
          color: #333;
        }
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: calc(60px + env(safe-area-inset-top));
          padding-top: env(safe-area-inset-top);
          display: flex;
          justify-content: space-between;
          align-items: center;
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
        .nav-link:hover {
          text-decoration: underline;
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
        .main-content {
          margin-top: calc(60px + env(safe-area-inset-top));
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .spinner-ring {
          display: inline-block;
          position: relative;
          width: 80px;
          height: 80px;
          margin-bottom: 20px;
        }
        .spinner-ring div {
          box-sizing: border-box;
          display: block;
          position: absolute;
          width: 64px;
          height: 64px;
          margin: 8px;
          border: 8px solid #999;
          border-radius: 50%;
          animation: ringSpin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          border-color: #999 transparent transparent transparent;
        }
        .spinner-ring div:nth-child(1) {
          animation-delay: -0.45s;
        }
        .spinner-ring div:nth-child(2) {
          animation-delay: -0.3s;
        }
        .spinner-ring div:nth-child(3) {
          animation-delay: -0.15s;
        }
        @keyframes ringSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loading-text {
          font-size: 1.1rem;
        }
        .footer {
          text-align: center;
          padding: 16px;
          font-size: 0.9rem;
          color: #777;
          border-top: 1px solid #ddd;
        }
      `}</style>
    </>
  );
}
