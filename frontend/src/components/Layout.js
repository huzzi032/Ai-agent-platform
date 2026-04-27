import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Bot, MessageSquare, Settings,
  LogOut, Menu, X, User, ChevronDown, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HexLogo = () => (
  <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
    <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="none" stroke="#00E5FF" strokeWidth="1.5"/>
    <rect x="11" y="13" width="5" height="4" rx="1" fill="#00E5FF"/>
    <rect x="20" y="13" width="5" height="4" rx="1" fill="#00E5FF"/>
    <rect x="12" y="20" width="12" height="3" rx="1" fill="#00E5FF" opacity="0.7"/>
    <rect x="16" y="9" width="4" height="2" rx="1" fill="#39FF14"/>
  </svg>
);

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navigation = [
    { name: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard },
    { name: 'My Bots',       href: '/agents',         icon: Bot },
    { name: 'Conversations', href: '/conversations',  icon: MessageSquare },
    { name: 'Settings',      href: '/settings',       icon: Settings },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div style={{ minHeight:'100vh', background:'#080B14', display:'flex', fontFamily:'Space Grotesk, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes itb-pulse-dot{0%,100%{box-shadow:0 0 0 0 rgba(57,255,20,0.4)}50%{box-shadow:0 0 0 5px transparent}}
        .itb-nav-link{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;text-decoration:none;font-size:0.88rem;font-weight:500;transition:all 0.2s;color:#4A5568;border:1px solid transparent;}
        .itb-nav-link:hover{color:#E8EDF5;background:rgba(255,255,255,0.04);border-color:rgba(0,229,255,0.08);}
        .itb-nav-link.active{color:#00E5FF;background:rgba(0,229,255,0.08);border-color:rgba(0,229,255,0.2);}
        .itb-nav-link.active svg{color:#00E5FF;}
        .itb-sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:40;backdrop-filter:blur(4px);}
        .itb-sidebar{position:fixed;top:0;left:0;z-index:50;height:100%;width:240px;background:#0D1117;border-right:1px solid rgba(0,229,255,0.08);display:flex;flex-direction:column;transition:transform 0.25s ease;}
        .itb-header{height:60px;background:#0D1117;border-bottom:1px solid rgba(0,229,255,0.08);display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:sticky;top:0;z-index:30;}
        @media(min-width:1024px){.itb-sidebar{transform:translateX(0)!important;}.itb-content{margin-left:240px;}}
        @media(max-width:1023px){.itb-sidebar.closed{transform:translateX(-100%)}.itb-sidebar.open{transform:translateX(0)}}
      `}</style>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && <div className="itb-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── SIDEBAR ────────────────────────── */}
      <aside className={`itb-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Logo */}
        <div style={{ height:60, display:'flex', alignItems:'center', padding:'0 16px', borderBottom:'1px solid rgba(0,229,255,0.08)', gap:10 }}>
          <HexLogo />
          <span style={{ fontWeight:700, fontSize:'1rem', color:'#E8EDF5', letterSpacing:'-0.01em' }}>
            Info<span style={{ color:'#00E5FF' }}>To</span>Bot
          </span>
          <span style={{ marginLeft:'auto', fontFamily:'JetBrains Mono, monospace', fontSize:'0.6rem', color:'#39FF14', border:'1px solid rgba(57,255,20,0.2)', background:'rgba(57,255,20,0.08)', padding:'2px 7px', borderRadius:99 }}>v2</span>
        </div>

        {/* System status */}
        <div style={{ margin:'12px 12px 4px', padding:'10px 14px', background:'rgba(57,255,20,0.05)', border:'1px solid rgba(57,255,20,0.1)', borderRadius:8, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ width:7, height:7, background:'#39FF14', borderRadius:'50%', display:'inline-block', animation:'itb-pulse-dot 2s infinite', boxShadow:'0 0 6px #39FF14' }}/>
          <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'0.68rem', color:'#39FF14', letterSpacing:'0.06em' }}>ALL SYSTEMS ONLINE</span>
        </div>

        {/* Nav */}
        <nav style={{ padding:'12px 12px', flex:1, display:'flex', flexDirection:'column', gap:4 }}>
          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'0.62rem', color:'#2D3550', letterSpacing:'0.1em', textTransform:'uppercase', padding:'4px 14px 8px' }}>Navigation</div>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)}
                className={`itb-nav-link ${isActive(item.href) ? 'active' : ''}`}>
                <Icon size={16} />
                {item.name}
              </Link>
            );
          })}

          <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'0.62rem', color:'#2D3550', letterSpacing:'0.1em', textTransform:'uppercase', padding:'16px 14px 8px' }}>Workspace</div>
          <Link to="/agents/create" onClick={() => setSidebarOpen(false)}
            className="itb-nav-link" style={{ color:'#00E5FF', background:'rgba(0,229,255,0.06)', borderColor:'rgba(0,229,255,0.15)' }}>
            <Zap size={16} />
            New Bot
          </Link>
        </nav>

        {/* User footer */}
        <div style={{ borderTop:'1px solid rgba(0,229,255,0.08)', padding:12 }}>
          <button onClick={() => setUserMenuOpen(!userMenuOpen)} style={{
            width:'100%', display:'flex', alignItems:'center', gap:12,
            padding:'10px 12px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)',
            borderRadius:10, cursor:'pointer', textAlign:'left', transition:'all 0.2s'
          }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(0,229,255,0.12)', border:'1px solid rgba(0,229,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <User size={16} color="#00E5FF" />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:0, color:'#E8EDF5', fontWeight:600, fontSize:'0.82rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user?.full_name || user?.username}
              </p>
              <p style={{ margin:0, color:'#4A5568', fontSize:'0.72rem', fontFamily:'JetBrains Mono, monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user?.email}
              </p>
            </div>
            <ChevronDown size={14} color="#4A5568" style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', flexShrink:0 }} />
          </button>

          {userMenuOpen && (
            <div style={{ marginTop:6, background:'#111827', border:'1px solid rgba(0,229,255,0.1)', borderRadius:10, overflow:'hidden' }}>
              <button onClick={handleLogout} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'none', border:'none', color:'#FF3B5C', cursor:'pointer', fontSize:'0.85rem', fontFamily:'Space Grotesk, sans-serif', transition:'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,59,92,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ───────────────────── */}
      <div className="itb-content" style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        {/* Header */}
        <header className="itb-header">
          <button onClick={() => setSidebarOpen(true)} style={{ display:'none', padding:8, background:'none', border:'none', cursor:'pointer', borderRadius:8 }} className="mobile-menu-btn">
            <Menu size={20} color="#7B8BA0" />
          </button>
          <style>{`@media(max-width:1023px){.mobile-menu-btn{display:flex!important;}}`}</style>

          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'0.75rem', color:'#4A5568' }}>
              {new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}
            </span>
            <div style={{ width:1, height:16, background:'rgba(255,255,255,0.06)' }}/>
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'0.72rem', color:'#39FF14', letterSpacing:'0.06em' }}>
              ● LIVE
            </span>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Link to="/agents/create" style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'rgba(0,229,255,0.08)', border:'1px solid rgba(0,229,255,0.2)', borderRadius:8, color:'#00E5FF', textDecoration:'none', fontSize:'0.8rem', fontWeight:600, transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(0,229,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(0,229,255,0.08)'}>
              <Zap size={14} />
              New Bot
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, padding:'28px 28px', overflowY:'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
