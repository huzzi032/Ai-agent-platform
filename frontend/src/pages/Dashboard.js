import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, MessageSquare, TrendingUp, Plus, ArrowRight, Activity, Zap } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import AgentCard from '../components/AgentCard';
import toast from 'react-hot-toast';

/* ─── Mini Sparkline SVG ─────────────────── */
const Sparkline = ({ data, color = '#00E5FF' }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 32;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
      <circle cx={pts.split(' ').pop().split(',')[0]} cy={pts.split(' ').pop().split(',')[1]} r="2.5" fill={color}/>
    </svg>
  );
};

/* ─── Bar Graph SVG ──────────────────────── */
const MiniBarGraph = ({ data, color = '#00E5FF' }) => {
  const max = Math.max(...data) || 1;
  return (
    <svg width="80" height="32" viewBox="0 0 80 32" fill="none">
      {data.map((v, i) => (
        <rect key={i} x={i * 12 + 2} y={32 - (v / max) * 28} width="8" height={(v / max) * 28} rx="2" fill={color} opacity="0.7"/>
      ))}
    </svg>
  );
};

/* ─── Stat Card ──────────────────────────── */
const StatCard = ({ label, value, icon: Icon, color, sparkData, trend, barData }) => (
  <div style={{
    background:'#0D1117', border:`1px solid ${color}20`,
    borderRadius:14, padding:'20px 22px',
    transition:'all 0.25s', cursor:'default',
    position:'relative', overflow:'hidden',
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor=`${color}50`; e.currentTarget.style.boxShadow=`0 0 24px ${color}15`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor=`${color}20`; e.currentTarget.style.boxShadow='none'; }}>
    <div style={{ position:'absolute', top:0, right:0, width:80, height:80, background:`radial-gradient(circle at 100% 0%, ${color}08 0%, transparent 70%)`, pointerEvents:'none' }}/>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
      <div>
        <p style={{ margin:'0 0 6px', fontSize:'0.72rem', fontFamily:'JetBrains Mono, monospace', color:'#4A5568', textTransform:'uppercase', letterSpacing:'0.08em' }}>{label}</p>
        <p style={{ margin:0, fontFamily:'JetBrains Mono, monospace', fontSize:'2rem', fontWeight:700, color:'#E8EDF5', lineHeight:1 }}>{value}</p>
      </div>
      <div style={{ width:40, height:40, borderRadius:10, background:`${color}12`, border:`1px solid ${color}20`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={18} color={color} />
      </div>
    </div>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      {trend && <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'0.7rem', color: trend.startsWith('↑') ? '#39FF14' : '#FF3B5C' }}>{trend}</span>}
      {sparkData && <Sparkline data={sparkData} color={color} />}
      {barData && <MiniBarGraph data={barData} color={color} />}
    </div>
  </div>
);

/* ─── DASHBOARD ──────────────────────────── */
export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const response = await dashboardAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:320, gap:16 }}>
        <div style={{ width:48, height:48, border:'2px solid rgba(0,229,255,0.1)', borderTop:'2px solid #00E5FF', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
        <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'0.8rem', color:'#4A5568' }}>Loading systems...</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const agents = dashboardData?.agents || [];
  const recentConversations = dashboardData?.recent_conversations || [];

  const sparkA = [20,35,28,50,42,60,55,70,65,80];
  const sparkM = [10,18,14,25,30,22,38,42,35,50];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28, fontFamily:'Space Grotesk, sans-serif' }}>
      {/* ── Header ─────────────────────────── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <span style={{ width:7, height:7, background:'#39FF14', borderRadius:'50%', display:'inline-block', boxShadow:'0 0 8px #39FF14', animation:'itb-pulse-dot 2s infinite' }}/>
            <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:'0.7rem', color:'#39FF14', letterSpacing:'0.08em', textTransform:'uppercase' }}>All Systems Operational</span>
          </div>
          <h1 style={{ margin:'0 0 4px', fontSize:'1.6rem', fontWeight:700, letterSpacing:'-0.025em', color:'#E8EDF5' }}>Command Center</h1>
          <p style={{ margin:0, color:'#4A5568', fontSize:'0.88rem', fontFamily:'JetBrains Mono, monospace' }}>
            <span style={{ color:'#00E5FF' }}>{user_greeting()}</span> — {new Date().toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' })}
          </p>
        </div>
        <Link to="/agents/create" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 20px', background:'#00E5FF', color:'#080B14', border:'none', borderRadius:10, textDecoration:'none', fontWeight:700, fontSize:'0.88rem', transition:'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow='0 0 24px rgba(0,229,255,0.4)'; e.currentTarget.style.transform='translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none'; }}>
          <Plus size={16}/>
          Deploy Bot
        </Link>
      </div>

      {/* ── Stat Cards ─────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
        <StatCard label="Total Bots" value={stats.total_agents || 0} icon={Bot} color="#00E5FF" sparkData={sparkA} trend="↑ Active fleet" />
        <StatCard label="Online" value={stats.active_agents || 0} icon={Activity} color="#39FF14" barData={[60,80,50,90,70,85,75]} trend="↑ All healthy" />
        <StatCard label="Conversations" value={stats.total_conversations || 0} icon={MessageSquare} color="#7C3AED" sparkData={sparkM} trend="↑ 12% this week" />
        <StatCard label="Total Messages" value={stats.total_messages || 0} icon={TrendingUp} color="#FFB800" barData={[30,55,40,70,45,80,65]} trend="↑ Growing" />
      </div>

      {/* ── Agent Type Tags ─────────────────── */}
      {stats.agents_by_type && Object.keys(stats.agents_by_type).length > 0 && (
        <div style={{ background:'#0D1117', border:'1px solid rgba(0,229,255,0.08)', borderRadius:14, padding:'20px 22px' }}>
          <p style={{ margin:'0 0 14px', fontFamily:'JetBrains Mono, monospace', fontSize:'0.72rem', color:'#4A5568', textTransform:'uppercase', letterSpacing:'0.08em' }}>Bot Distribution</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {Object.entries(stats.agents_by_type).map(([type, count]) => (
              <div key={type} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 14px', background:'rgba(0,229,255,0.06)', border:'1px solid rgba(0,229,255,0.12)', borderRadius:8 }}>
                <Zap size={12} color="#00E5FF" />
                <span style={{ color:'#C4CFDE', fontSize:'0.82rem', textTransform:'capitalize' }}>{type}</span>
                <span style={{ fontFamily:'JetBrains Mono, monospace', fontWeight:700, fontSize:'0.8rem', color:'#00E5FF', background:'rgba(0,229,255,0.08)', padding:'1px 8px', borderRadius:4 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Agents Grid ────────────────────── */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <h2 style={{ margin:0, fontSize:'1rem', fontWeight:600, color:'#E8EDF5' }}>Your Bots</h2>
          <Link to="/agents" style={{ display:'flex', alignItems:'center', gap:4, color:'#00E5FF', textDecoration:'none', fontSize:'0.82rem', fontFamily:'JetBrains Mono, monospace' }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {agents.length > 0 ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
            {agents.slice(0, 6).map((agent) => <AgentCard key={agent.id} agent={agent} />)}
          </div>
        ) : (
          <div style={{ background:'#0D1117', border:'1px solid rgba(0,229,255,0.08)', borderRadius:14, padding:'64px 24px', textAlign:'center' }}>
            <div style={{ width:60, height:60, background:'rgba(0,229,255,0.08)', border:'1px solid rgba(0,229,255,0.15)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Bot size={28} color="#00E5FF" />
            </div>
            <h3 style={{ margin:'0 0 8px', fontSize:'1rem', fontWeight:600, color:'#E8EDF5' }}>No bots deployed yet</h3>
            <p style={{ margin:'0 0 24px', color:'#4A5568', fontSize:'0.88rem', fontFamily:'JetBrains Mono, monospace' }}>Deploy your first RAG bot in under 60 seconds.</p>
            <Link to="/agents/create" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 22px', background:'rgba(0,229,255,0.08)', border:'1px solid rgba(0,229,255,0.2)', borderRadius:10, color:'#00E5FF', textDecoration:'none', fontWeight:600, fontSize:'0.88rem' }}>
              <Plus size={15}/> Deploy First Bot
            </Link>
          </div>
        )}
      </div>

      {/* ── Recent Conversations ────────────── */}
      {recentConversations.length > 0 && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h2 style={{ margin:0, fontSize:'1rem', fontWeight:600, color:'#E8EDF5' }}>Recent Conversations</h2>
            <Link to="/conversations" style={{ display:'flex', alignItems:'center', gap:4, color:'#00E5FF', textDecoration:'none', fontSize:'0.82rem', fontFamily:'JetBrains Mono, monospace' }}>
              View all <ArrowRight size={14}/>
            </Link>
          </div>
          <div style={{ background:'#0D1117', border:'1px solid rgba(0,229,255,0.08)', borderRadius:14, overflow:'hidden' }}>
            {recentConversations.slice(0, 5).map((conv, i) => (
              <div key={conv.id} style={{ padding:'14px 20px', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.03)' : 'none', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'background 0.15s', cursor:'default' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(0,229,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div>
                  <p style={{ margin:'0 0 3px', fontSize:'0.88rem', fontWeight:500, color:'#C4CFDE' }}>{conv.title}</p>
                  <p style={{ margin:0, fontSize:'0.72rem', fontFamily:'JetBrains Mono, monospace', color:'#4A5568', textTransform:'capitalize' }}>{conv.platform}</p>
                </div>
                <span style={{ fontSize:'0.72rem', fontFamily:'JetBrains Mono, monospace', color:'#2D3550' }}>
                  {new Date(conv.updated_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function user_greeting() {
  const h = new Date().getHours();
  if (h < 12) return '🌅 Good morning';
  if (h < 17) return '☀️ Good afternoon';
  return '🌙 Good evening';
}
