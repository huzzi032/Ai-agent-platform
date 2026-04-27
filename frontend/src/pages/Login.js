import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const HexRobot = () => (
  <svg width="90" height="90" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 0 18px rgba(0,229,255,0.55))', animation: 'float-up-down 4s ease-in-out infinite' }}>
    <polygon points="60,8 104,32 104,88 60,112 16,88 16,32" fill="rgba(0,229,255,0.07)" stroke="#00E5FF" strokeWidth="1.5"/>
    <polygon points="60,18 96,38 96,82 60,102 24,82 24,38" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.25)" strokeWidth="1"/>
    <rect x="42" y="46" width="14" height="10" rx="3" fill="#00E5FF"/>
    <rect x="64" y="46" width="14" height="10" rx="3" fill="#00E5FF"/>
    <rect x="44" y="64" width="32" height="6" rx="3" fill="#00E5FF" opacity="0.7"/>
    <rect x="58" y="36" width="4" height="6" rx="2" fill="#39FF14"/>
  </svg>
);

export default function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(formData.username, formData.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: 'Space Grotesk, sans-serif',
      background: 'var(--itb-black)',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes float-up-down { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes itb-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes grid-scroll { 0%{background-position:0 0} 100%{background-position:0 120px} }
        .login-input { width:100%; padding:13px 16px; background:rgba(13,17,23,0.8); border:1px solid rgba(30,45,69,1); border-radius:10px; color:#E8EDF5; font-family:'Space Grotesk',sans-serif; font-size:0.95rem; outline:none; transition:all 0.2s; box-sizing:border-box; }
        .login-input::placeholder { color:#2D3550; }
        .login-input:focus { border-color:#00E5FF; box-shadow:0 0 0 3px rgba(0,229,255,0.1); }
        .login-btn { width:100%; padding:14px; background:#00E5FF; color:#080B14; border:none; border-radius:10px; font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:1rem; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .login-btn:hover:not(:disabled) { box-shadow:0 0 28px rgba(0,229,255,0.4); transform:translateY(-1px); }
        .login-btn:disabled { opacity:0.6; cursor:not-allowed; }
      `}</style>

      {/* ── LEFT PANEL ─────────────────────── */}
      <div style={{
        flex: 1, display: 'none', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        background: 'linear-gradient(135deg, #0D1117 0%, #0D1525 100%)',
        borderRight: '1px solid rgba(0,229,255,0.08)',
        padding: 60, position: 'relative', overflow: 'hidden',
        backgroundImage: 'linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} className="login-left">
        <style>{`.login-left { display: flex !important; } @media(max-width:768px){.login-left{display:none!important;}}`}</style>

        {/* Glow */}
        <div style={{ position:'absolute', top:'20%', left:'30%', width:280, height:280, background:'radial-gradient(circle, rgba(0,229,255,0.1) 0%, transparent 70%)', borderRadius:'50%', pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:400 }}>
          <HexRobot />
          <h2 style={{ fontSize:'1.8rem', fontWeight:700, letterSpacing:'-0.025em', margin:'32px 0 12px', color:'#E8EDF5' }}>
            Info<span style={{ color:'#00E5FF' }}>To</span>Bot
          </h2>
          <p style={{ color:'#7B8BA0', fontSize:'0.95rem', lineHeight:1.6, marginBottom:48 }}>
            Your RAG-powered bot command center. Deploy intelligent agents across every channel.
          </p>

          {/* Status list */}
          {[
            { icon:'◉', label:'12 bots online', color:'#39FF14' },
            { icon:'◈', label:'2.8M queries this month', color:'#00E5FF' },
            { icon:'◆', label:'99.97% uptime today', color:'#FFB800' },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', background:'rgba(26,32,53,0.5)', border:'1px solid rgba(0,229,255,0.08)', borderRadius:10, marginBottom:10, textAlign:'left' }}>
              <span style={{ color:s.color, fontSize:'1.1rem' }}>{s.icon}</span>
              <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'0.78rem', color:'#7B8BA0' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'40px 24px', minWidth:0 }}>
        <div style={{ width:'100%', maxWidth:420 }}>
          {/* Mobile logo */}
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:52, height:52, background:'rgba(0,229,255,0.08)', border:'1px solid rgba(0,229,255,0.2)', borderRadius:14, marginBottom:16 }}>
              <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
                <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="none" stroke="#00E5FF" strokeWidth="1.5"/>
                <rect x="11" y="13" width="5" height="4" rx="1" fill="#00E5FF"/>
                <rect x="20" y="13" width="5" height="4" rx="1" fill="#00E5FF"/>
                <rect x="12" y="20" width="12" height="3" rx="1" fill="#00E5FF" opacity="0.7"/>
              </svg>
            </div>
            <h1 style={{ fontSize:'1.7rem', fontWeight:700, letterSpacing:'-0.025em', margin:'0 0 6px', color:'#E8EDF5' }}>
              Welcome back
            </h1>
            <p style={{ color:'#4A5568', fontSize:'0.9rem', margin:0, fontFamily:'JetBrains Mono, monospace' }}>
              <span style={{ color:'#00E5FF' }}>$</span> auth.login --user
            </p>
          </div>

          {/* Form card */}
          <div style={{ background:'rgba(17,24,39,0.6)', border:'1px solid rgba(30,45,69,0.8)', borderRadius:16, padding:'36px 32px', backdropFilter:'blur(12px)' }}>
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontFamily:'JetBrains Mono, monospace', color:'#7B8BA0', marginBottom:8, letterSpacing:'0.06em', textTransform:'uppercase' }}>Username or Email</label>
                <input id="username" name="username" type="text" value={formData.username} onChange={handleChange} className="login-input" placeholder="you@company.com" autoComplete="username" />
              </div>

              <div>
                <label style={{ display:'block', fontSize:'0.8rem', fontFamily:'JetBrains Mono, monospace', color:'#7B8BA0', marginBottom:8, letterSpacing:'0.06em', textTransform:'uppercase' }}>Password</label>
                <div style={{ position:'relative' }}>
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} className="login-input" placeholder="••••••••••" autoComplete="current-password" style={{ paddingRight:48 }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#4A5568', cursor:'pointer', display:'flex', alignItems:'center' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="login-btn">
                {loading ? <><Loader2 size={18} style={{ animation:'spin 1s linear infinite' }} /> Authenticating...</> : 'Sign In →'}
              </button>
            </form>

            <div style={{ marginTop:24, textAlign:'center' }}>
              <p style={{ color:'#4A5568', fontSize:'0.88rem', margin:0 }}>
                No account?{' '}
                <Link to="/register" style={{ color:'#00E5FF', textDecoration:'none', fontWeight:600 }}>Create one free</Link>
              </p>
            </div>
          </div>

          <p style={{ textAlign:'center', marginTop:28, color:'#2D3550', fontFamily:'JetBrains Mono, monospace', fontSize:'0.7rem' }}>
            <Link to="/" style={{ color:'#2D3550', textDecoration:'none' }}>← Back to InfoToBot.io</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
