import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const HexLogo = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon
      points="18,2 32,10 32,26 18,34 4,26 4,10"
      fill="none"
      stroke="#00E5FF"
      strokeWidth="1.5"
    />
    <polygon
      points="18,7 28,13 28,23 18,29 8,23 8,13"
      fill="rgba(0,229,255,0.08)"
      stroke="rgba(0,229,255,0.3)"
      strokeWidth="1"
    />
    {/* Robot face */}
    <rect x="13" y="13" width="4" height="3" rx="1" fill="#00E5FF" />
    <rect x="19" y="13" width="4" height="3" rx="1" fill="#00E5FF" />
    <rect x="14" y="19" width="8" height="2" rx="1" fill="#00E5FF" opacity="0.7"/>
    <rect x="17" y="10" width="2" height="2" rx="1" fill="#39FF14" />
  </svg>
);

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Features', to: '/features' },
    { label: 'Pricing', to: '/pricing' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <style>{`
        .pnav-root {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          font-family: 'Space Grotesk', sans-serif;
          transition: all 0.3s ease;
        }
        .pnav-root.scrolled {
          background: rgba(8,11,20,0.92);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(0,229,255,0.12);
          box-shadow: 0 4px 32px rgba(0,0,0,0.4);
        }
        .pnav-root.top {
          background: transparent;
          border-bottom: 1px solid transparent;
        }
        .pnav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
        }
        .pnav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #E8EDF5;
        }
        .pnav-logo-text {
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .pnav-logo-text span { color: #00E5FF; }
        .pnav-links {
          display: flex;
          align-items: center;
          gap: 4px;
          list-style: none;
          margin: 0; padding: 0;
        }
        .pnav-links a {
          padding: 8px 16px;
          border-radius: 8px;
          color: #7B8BA0;
          text-decoration: none;
          font-size: 0.92rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .pnav-links a:hover { color: #E8EDF5; background: rgba(255,255,255,0.05); }
        .pnav-links a.active { color: #00E5FF; }
        .pnav-actions { display: flex; align-items: center; gap: 10px; }
        .pnav-login {
          padding: 9px 20px;
          border-radius: 8px;
          color: #7B8BA0;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        .pnav-login:hover { color: #E8EDF5; border-color: rgba(0,229,255,0.2); background: rgba(0,229,255,0.06); }
        .pnav-cta {
          padding: 9px 20px;
          background: #00E5FF;
          color: #080B14;
          border-radius: 8px;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 700;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }
        .pnav-cta:hover {
          box-shadow: 0 0 20px rgba(0,229,255,0.4);
          transform: translateY(-1px);
        }
        /* Tag */
        .pnav-version {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          color: #39FF14;
          border: 1px solid rgba(57,255,20,0.25);
          background: rgba(57,255,20,0.08);
          padding: 2px 8px;
          border-radius: 99px;
          letter-spacing: 0.06em;
        }
        /* Mobile */
        .pnav-hamburger {
          display: none;
          flex-direction: column;
          gap: 4px;
          cursor: pointer;
          padding: 8px;
          background: none;
          border: none;
        }
        .pnav-hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #7B8BA0;
          border-radius: 2px;
          transition: all 0.25s;
        }
        .pnav-mobile-menu {
          display: none;
        }
        @media (max-width: 768px) {
          .pnav-links, .pnav-actions { display: none; }
          .pnav-hamburger { display: flex; }
          .pnav-mobile-menu {
            display: block;
            position: fixed;
            top: 68px; left: 0; right: 0;
            background: rgba(8,11,20,0.98);
            backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(0,229,255,0.1);
            padding: 16px 24px 24px;
          }
          .pnav-mobile-menu a {
            display: block;
            padding: 12px 0;
            color: #7B8BA0;
            text-decoration: none;
            font-size: 1rem;
            font-weight: 500;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            transition: color 0.2s;
          }
          .pnav-mobile-menu a:hover { color: #00E5FF; }
          .pnav-mobile-cta {
            display: block;
            margin-top: 16px;
            padding: 12px;
            background: #00E5FF;
            color: #080B14 !important;
            text-align: center;
            border-radius: 8px;
            font-weight: 700 !important;
          }
        }
      `}</style>

      <nav className={`pnav-root ${scrolled ? 'scrolled' : 'top'}`}>
        <div className="pnav-inner">
          {/* Logo */}
          <Link to="/" className="pnav-logo">
            <HexLogo />
            <span className="pnav-logo-text">Info<span>To</span>Bot</span>
            <span className="pnav-version">v2.0</span>
          </Link>

          {/* Nav Links */}
          <ul className="pnav-links">
            {navLinks.map(link => (
              <li key={link.to}>
                <Link to={link.to} className={isActive(link.to) ? 'active' : ''}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="pnav-actions">
            <Link to="/login" className="pnav-login">Sign in</Link>
            <Link to="/register" className="pnav-cta">Get Started →</Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="pnav-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span style={{ transform: menuOpen ? 'rotate(45deg) translateY(6px)' : 'none' }} />
            <span style={{ opacity: menuOpen ? 0 : 1 }} />
            <span style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="pnav-mobile-menu">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to}>{link.label}</Link>
          ))}
          <Link to="/login">Sign in</Link>
          <Link to="/register" className="pnav-mobile-cta">Get Started →</Link>
        </div>
      )}
    </>
  );
}
