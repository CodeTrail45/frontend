// File: pages/_app.js
import '../styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Simple fade-in
  useEffect(() => {
    // Optionally track route changes for fade-out, etc.
  }, [router.events]);

  return (
    <div className="page-fade">
      <Component {...pageProps} />
      <style jsx>{`
        .page-fade {
          animation: fadeIn 0.4s ease forwards;
          opacity: 0;
        }
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default MyApp;
