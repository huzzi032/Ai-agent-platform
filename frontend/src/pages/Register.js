import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const features = [
  { icon: '⬡', text: 'RAG-powered knowledge engine' },
  { icon: '◈', text: 'Deploy to WhatsApp, Telegram, Web' },
  { icon: '◉', text: 'Real-time analytics dashboard' },
  { icon: '◆', text: 'Auto-training on new uploads' },
];

export default function Register() {
  const [formData, setFormData] = useState({ username:'', email:'', full_name:'', password:'', confirm_password:'' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) { toast.error('Please fill in all required fields'); return; }
    if (formData.password !== formData.confirm_password) { toast.error('Passwords do not match'); return; }
    if (formData.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register({ username:formData.username, email:formData.email, full_name:formData.full_name, password:formData.password });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const pwReqs = [
    { label:'8+ characters', met: formData.password.length >= 8 },
    { label:'Uppercase', met: /[A-Z]/.test(formData.password) },
    { label:'Lowercase', met: /[a-z]/.test(formData.password) },
    { label:'Number', met: /\d/.test(formData.password) },
  ];

  const pwStrength = pwReqs.filter(r => r.met).length;
  const pwColor = ['#FF3B5C','#FF3B5C','#FFB800','#FFB800','#39FF14'][pwStrength];

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:'Space Grotesk, sans-serif', background:'var(--itb-black)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes float-up-down{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .reg-input{width:100%;padding:13px 16px;background:rgba(13,17,23,0.8);border:1px solid rgba(30,45,69,1);border-radius:10px;color:#E8EDF5;font-family:'Space Grotesk',sans-serif;font-size:0.95rem;outline:none;transition:all 0.2s;box-sizing:border-box;}
        .reg-input::placeholder{color:#2D3550;}
        .reg-input:focus{border-color:#00E5FF;box-shadow:0 0 0 3px rgba(0,229,255,0.1);}
        .reg-btn{width:100%;padding:14px;background:#00E5FF;color:#080B14;border:none;border-radius:10px;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:1rem;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px;}
        .reg-btn:hover:not(:disabled){box-shadow:0 0 28px rgba(0,229,255,0.4);transform:translateY(-1px);}
        .reg-btn:disabled{opacity:0.6;cursor:not-allowed;}
        .reg-left{display:flex!important;}
        @media(max-width:768px){.reg-left{display:none!important;}}
      `}</style>

      {/* ── LEFT PANEL ─────────────────────── */}
      <div className="reg-left" style={{
        flex:1, flexDirection:'column', justifyContent:'center', alignItems:'center',
        background:'linear-gradient(135deg, #0D1117 0%, #0D1525 100%)',
        borderRight:'1px solid rgba(0,229,255,0.08)',
        padding:60, position:'relative', overflow:'hidden',
        backgroundImage:'linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px),linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)',
        backgroundSize:'40px 40px',
      }}>
        <div style={{ position:'absolute', bottom:'20%', right:'20%', width:260, height:260, background:'radial-gradient(circle, rgba(57,255,20,0.08) 0%, transparent 70%)', borderRadius:'50%', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:380 }}>
          <div style={{ fontSize:'4rem', marginBottom:24, animation:'float-up-down 4s ease-in-out infinite', display:'inline-block' }}>🤖</div>
          <h2 style={{ fontSize:'1.7rem', fontWeight:700, letterSpacing:'-0.025em', margin:'0 0 12px', color:'#E8EDF5' }}>
            Start building<br />smarter bots
          </h2>
          <p style={{ color:'#7B8BA0', fontSize:'0.9rem', lineHeight:1.65, marginBottom:48 }}>
            Join 2,500+ businesses using Info To Bot to automate customer conversations.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {features.map(f => (
              <div key={f.text} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:'rgba(26,32,53,0.5)', border:'1px solid rgba(0,229,255,0.08)', borderRadius:10, textAlign:'left' }}>
                <span style={{ fontSize:'1.2rem', color:'#00E5FF' }}>{f.icon}</span>
                <span style={{ fontSize:'0.85rem', color:'#7B8BA0', fontFamily:'Space Grotesk, sans-serif' }}>{f.text}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop:36, padding:'16px 20px', background:'rgba(57,255,20,0.06)', border:'1px solid rgba(57,255,20,0.15)', borderRadius:10 }}>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'0.72rem', color:'#39FF14', letterSpacing:'0.08em' }}>FREE PLAN INCLUDES</div>
            <div style={{ color:'#7B8BA0', fontSize:'0.82rem', marginTop:6 }}>1 bot · 50 docs · Unlimited messages</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'40px 24px', minWidth:0 }}>
        <div style={{ width:'100%', maxWidth:420 }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <h1 style={{ fontSize:'1.7rem', fontWeight:700, letterSpacing:'-0.025em', margin:'0 0 6px', color:'#E8EDF5' }}>Create account</h1>
            <p style={{ color:'#4A5568', fontSize:'0.88rem', margin:0, fontFamily:'JetBrains Mono, monospace' }}>
              <span style={{ color:'#00E5FF' }}>$</span> auth.register --new
            </p>
          </div>

          <div style={{ background:'rgba(17,24,39,0.6)', border:'1px solid rgba(30,45,69,0.8)', borderRadius:16, padding:'32px 28px', backdropFilter:'blur(12px)' }}>
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {[
                { id:'username', label:'Username *', type:'text', placeholder:'yourhandle', auto:'username' },
                { id:'email',    label:'Email *',    type:'email', placeholder:'you@company.com', auto:'email' },
                { id:'full_name',label:'Full Name',  type:'text', placeholder:'Jane Smith', auto:'name' },
              ].map(f => (
                <div key={f.id}>
                  <label style={{ display:'block', fontSize:'0.75rem', fontFamily:'JetBrains Mono, monospace', color:'#7B8BA0', marginBottom:7, letterSpacing:'0.06em', textTransform:'uppercase' }}>{f.label}</label>
                  <input id={f.id} name={f.id} type={f.type} value={formData[f.id]} onChange={handleChange} className="reg-input" placeholder={f.placeholder} autoComplete={f.auto} />
                </div>
              ))}

              <div>
                <label style={{ display:'block', fontSize:'0.75rem', fontFamily:'JetBrains Mono, monospace', color:'#7B8BA0', marginBottom:7, letterSpacing:'0.06em', textTransform:'uppercase' }}>Password *</label>
                <div style={{ position:'relative' }}>
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} className="reg-input" placeholder="Min 8 characters" autoComplete="new-password" style={{ paddingRight:48 }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#4A5568', cursor:'pointer', display:'flex', alignItems:'center' }}>
                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
                {/* Strength bar */}
                {formData.password && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ height:3, background:'rgba(255,255,255,0.05)', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${(pwStrength/4)*100}%`, background:pwColor, borderRadius:2, transition:'all 0.3s' }}/>
                    </div>
                    <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                      {pwReqs.map(r => (
                        <span key={r.label} style={{ fontSize:'0.68rem', fontFamily:'JetBrains Mono, monospace', color:r.met ? '#39FF14' : '#2D3550' }}>✓ {r.label}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display:'block', fontSize:'0.75rem', fontFamily:'JetBrains Mono, monospace', color:'#7B8BA0', marginBottom:7, letterSpacing:'0.06em', textTransform:'uppercase' }}>Confirm Password *</label>
                <input id="confirm_password" name="confirm_password" type={showPassword ? 'text' : 'password'} value={formData.confirm_password} onChange={handleChange} className="reg-input" placeholder="Repeat password" autoComplete="new-password" style={{ borderColor: formData.confirm_password && formData.confirm_password !== formData.password ? '#FF3B5C' : undefined }} />
              </div>

              <button type="submit" disabled={loading} className="reg-btn" style={{ marginTop:4 }}>
                {loading ? <><Loader2 size={18} style={{ animation:'spin 1s linear infinite' }}/> Creating account...</> : 'Create Account →'}
              </button>
            </form>

            <div style={{ marginTop:20, textAlign:'center' }}>
              <p style={{ color:'#4A5568', fontSize:'0.88rem', margin:0 }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color:'#00E5FF', textDecoration:'none', fontWeight:600 }}>Sign in</Link>
              </p>
            </div>
          </div>

          <p style={{ textAlign:'center', marginTop:24, color:'#2D3550', fontFamily:'JetBrains Mono, monospace', fontSize:'0.7rem' }}>
            <Link to="/" style={{ color:'#2D3550', textDecoration:'none' }}>← Back to InfoToBot.io</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
