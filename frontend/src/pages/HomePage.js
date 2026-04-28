import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';

/* ─── Animated SVG Bar Graph ─────────────── */
const LiveBarGraph = () => {
  const bars = [42, 67, 55, 80, 63, 91, 74, 85, 70, 95, 60, 88];
  return (
    <svg viewBox="0 0 240 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#39FF14" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#39FF14" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[20, 40, 60, 80].map(y => (
        <line key={y} x1="0" y1={y} x2="240" y2={y} stroke="rgba(0,229,255,0.08)" strokeWidth="1" />
      ))}
      {/* Bars */}
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 20 + 2}
          y={100 - h}
          width="14"
          height={h}
          rx="2"
          fill={i % 3 === 0 ? 'url(#barGrad2)' : 'url(#barGrad)'}
          style={{ animation: `itb-counter-bars 1.2s ${i * 0.08}s ease forwards`, height: 0, '--bar-h': h + 'px' }}
        />
      ))}
      {/* Live dot */}
      <circle cx="226" cy="5" r="4" fill="#39FF14">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};

/* ─── Animated Line Graph ─────────────────── */
const LiveLineGraph = () => {
  const points = "20,80 45,55 70,68 95,30 120,45 145,20 170,35 200,15 230,25";
  return (
    <svg viewBox="0 0 240 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`20,80 45,55 70,68 95,30 120,45 145,20 170,35 200,15 230,25 230,100 20,100`} fill="url(#lineAreaGrad)" />
      <polyline points={points} stroke="#00E5FF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {points.split(' ').map((pt, i) => {
        const [x, y] = pt.split(',');
        return <circle key={i} cx={x} cy={y} r="3" fill="#00E5FF" stroke="#080B14" strokeWidth="1.5" />;
      })}
    </svg>
  );
};

/* ─── Hex Robot Logo ──────────────────────── */
const HexRobot = ({ size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ animation: 'itb-spin-slow 20s linear infinite', filter: 'drop-shadow(0 0 12px rgba(0,229,255,0.5))' }}>
    <polygon points="60,8 104,32 104,88 60,112 16,88 16,32" fill="rgba(0,229,255,0.06)" stroke="#00E5FF" strokeWidth="1.5" />
    <polygon points="60,18 96,38 96,82 60,102 24,82 24,38" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.3)" strokeWidth="1" />
    <rect x="42" y="46" width="14" height="10" rx="3" fill="#00E5FF" />
    <rect x="64" y="46" width="14" height="10" rx="3" fill="#00E5FF" />
    <rect x="44" y="64" width="32" height="6" rx="3" fill="#00E5FF" opacity="0.7" />
    <rect x="58" y="36" width="4" height="6" rx="2" fill="#39FF14" />
    <line x1="60" y1="8" x2="60" y2="18" stroke="rgba(0,229,255,0.4)" strokeWidth="1" />
    <line x1="104" y1="32" x2="96" y2="38" stroke="rgba(0,229,255,0.4)" strokeWidth="1" />
    <line x1="104" y1="88" x2="96" y2="82" stroke="rgba(0,229,255,0.4)" strokeWidth="1" />
  </svg>
);

/* ─── Stat Counter ───────────────────────── */
function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return [count, ref];
}

const StatCard = ({ value, suffix = '', label, color = '#00E5FF' }) => {
  const [count, ref] = useCounter(value);
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '2.8rem', fontWeight: 700, color, lineHeight: 1 }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ color: '#7B8BA0', fontSize: '0.9rem', marginTop: 6, fontFamily: 'Space Grotesk, sans-serif' }}>{label}</div>
    </div>
  );
};

/* ─── Feature Card ───────────────────────── */
const FeatureCard = ({ icon, title, desc, delay }) => (
  <div className="itb-card itb-animate-fadeup" style={{ padding: '28px 24px', animationDelay: delay, opacity: 0, animationFillMode: 'forwards' }}>
    <div style={{ fontSize: '2rem', marginBottom: 16 }}>{icon}</div>
    <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.05rem', fontWeight: 600, color: '#E8EDF5', marginBottom: 8 }}>{title}</h3>
    <p style={{ color: '#7B8BA0', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{desc}</p>
  </div>
);

/* ─── Step Card ──────────────────────────── */
const StepCard = ({ num, title, desc }) => (
  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
    <div style={{
      width: 44, height: 44, flexShrink: 0,
      border: '2px solid #00E5FF',
      borderRadius: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'JetBrains Mono, monospace',
      fontWeight: 700, fontSize: '1rem', color: '#00E5FF',
      background: 'rgba(0,229,255,0.08)',
    }}>{num}</div>
    <div>
      <h4 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '1rem', color: '#E8EDF5', margin: '0 0 6px' }}>{title}</h4>
      <p style={{ color: '#7B8BA0', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  </div>
);

/* ─── HOMEPAGE ───────────────────────────── */
export default function HomePage() {
  const features = [
    { icon: '⬡', title: 'RAG Knowledge Engine', desc: 'Upload any document — PDF, DOCX, CSV — and our vector pipeline makes it instantly queryable.' },
    { icon: '◈', title: 'Multi-Platform Agents', desc: 'Deploy bots to WhatsApp, Telegram, Instagram, Gmail, or your custom website with one click.' },
    { icon: '◉', title: 'Real-Time Analytics', desc: 'Live dashboards track message volumes, accuracy scores, and response latencies across all bots.' },
    { icon: '⬟', title: 'Zero-Code Integration', desc: 'Drop a single <script> tag or use our REST API. Works with WordPress, Shopify, and more.' },
    { icon: '◆', title: 'Auto-Training Pipeline', desc: 'Upload new docs and the system retrains automatically — no manual intervention needed.' },
    { icon: '⬡', title: 'Enterprise Security', desc: 'SOC2-ready architecture with encrypted vector stores, role-based access, and audit logs.' },
  ];

  return (
    <div className="itb-root itb-grid-bg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      <PublicNavbar />

      {/* ── HERO ──────────────────────────── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        padding: '120px 24px 80px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '15%', left: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(0,229,255,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(57,255,20,0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          {/* Left */}
          <div>
            <div className="itb-tag itb-animate-fadein" style={{ marginBottom: 24 }}>
              <span className="itb-status-online" />
              System Online — v2.0 Production
            </div>
            <h1 className="itb-animate-fadeup" style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', fontWeight: 700,
              lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 24px',
            }}>
              <span className="itb-gradient-text">Turn Any Document</span><br />
              Into a Smart Bot.<br />
              <span style={{ color: '#7B8BA0', fontWeight: 400 }}>Instantly.</span>
            </h1>
            <p className="itb-animate-fadeup itb-delay-200" style={{
              color: '#7B8BA0', fontSize: '1.1rem', lineHeight: 1.7,
              maxWidth: 480, margin: '0 0 40px',
            }}>
              Info To Bot transforms your PDFs, docs, and data into intelligent RAG-powered chatbots that deploy across every channel your customers use.
            </p>
            <div className="itb-animate-fadeup itb-delay-300" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to="/register" className="itb-btn-primary">
                Deploy Your First Bot →
              </Link>
              <Link to="/features" className="itb-btn-ghost">
                See How It Works
              </Link>
            </div>
            <div className="itb-animate-fadeup itb-delay-400" style={{ marginTop: 40, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              {[['< 60s', 'Deploy time'], ['99.9%', 'Uptime SLA'], ['10M+', 'Msgs processed']].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', color: '#00E5FF', fontWeight: 700, fontSize: '1.3rem' }}>{v}</div>
                  <div style={{ color: '#4A5568', fontSize: '0.8rem', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — visual dashboard */}
          <div className="itb-animate-fadein itb-delay-300" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Robot + top card */}
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="itb-card" style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#7B8BA0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Agent Activity</span>
                  <span className="itb-status-online" />
                </div>
                <div style={{ height: 80 }}><LiveBarGraph /></div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: '#39FF14' }}>↑ 23% vs last week</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HexRobot size={100} />
              </div>
            </div>

            {/* Line graph card */}
            <div className="itb-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#7B8BA0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Query Accuracy</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: '#00E5FF' }}>94.7%</span>
              </div>
              <div style={{ height: 80 }}><LiveLineGraph /></div>
            </div>

            {/* Mini status row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Bots Online', value: '12 / 12', color: '#39FF14' },
                { label: 'Docs Indexed', value: '2,847', color: '#00E5FF' },
                { label: 'Avg Response', value: '142ms', color: '#FFB800' },
                { label: 'API Uptime', value: '99.97%', color: '#00E5FF' },
              ].map(s => (
                <div key={s.label} className="itb-card" style={{ padding: '14px 16px' }}>
                  <div style={{ color: '#4A5568', fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ color: s.color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '1rem' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────── */}
      <section style={{ background: 'rgba(26,32,53,0.6)', borderTop: '1px solid rgba(0,229,255,0.08)', borderBottom: '1px solid rgba(0,229,255,0.08)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, textAlign: 'center' }}>
          <StatCard value={10000} suffix="+" label="Bots Deployed" color="#00E5FF" />
          <StatCard value={50} suffix="M+" label="Messages Processed" color="#39FF14" />
          <StatCard value={2500} suffix="+" label="Active Businesses" color="#00E5FF" />
          <StatCard value={99} suffix=".9%" label="Uptime SLA" color="#FFB800" />
        </div>
      </section>

      {/* ── FEATURES ──────────────────────── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="itb-tag" style={{ marginBottom: 16 }}>Capabilities</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 16px' }}>
              Everything you need to <span className="itb-gradient-text">automate intelligence</span>
            </h2>
            <p style={{ color: '#7B8BA0', fontSize: '1rem', maxWidth: 560, margin: '0 auto' }}>
              From document ingestion to multi-channel deployment — one unified platform.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {features.map((f, i) => (
              <FeatureCard key={i} {...f} delay={`${i * 0.08}s`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────── */}
      <section style={{ padding: '80px 24px', background: 'rgba(13,17,23,0.7)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div className="itb-tag" style={{ marginBottom: 20 }}>Pipeline</div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 40px' }}>
              From upload to<br /><span className="itb-gradient-text">production in 3 steps</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <StepCard num="01" title="Upload Your Knowledge" desc="Drop PDFs, spreadsheets, or paste URLs. Our pipeline chunks, embeds, and indexes everything into a vector store." />
              <StepCard num="02" title="Configure Your Bot" desc="Set the persona, instructions, and platform. Choose WhatsApp, Telegram, web widget, or API." />
              <StepCard num="03" title="Deploy & Monitor" desc="Go live in under 60 seconds. Watch real-time analytics as your bot handles queries autonomously." />
            </div>
          </div>
          {/* Terminal visual */}
          <div className="itb-card" style={{ padding: 0, overflow: 'hidden', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
            <div style={{ background: '#0D1117', padding: '12px 16px', borderBottom: '1px solid rgba(0,229,255,0.1)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF3B5C', display: 'inline-block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFB800', display: 'inline-block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#39FF14', display: 'inline-block' }} />
              <span style={{ color: '#4A5568', marginLeft: 8, fontSize: '0.75rem' }}>info-to-bot — deploy</span>
            </div>
            <div style={{ padding: 24, lineHeight: 2 }}>
              <div style={{ color: '#4A5568' }}>$ itb deploy --agent my-bot</div>
              <div style={{ color: '#7B8BA0' }}>  ✓ Documents indexed: <span style={{ color: '#00E5FF' }}>247 chunks</span></div>
              <div style={{ color: '#7B8BA0' }}>  ✓ Embeddings created: <span style={{ color: '#00E5FF' }}>247 vectors</span></div>
              <div style={{ color: '#7B8BA0' }}>  ✓ Platform: <span style={{ color: '#39FF14' }}>WhatsApp + Web</span></div>
              <div style={{ color: '#7B8BA0' }}>  ✓ Endpoint: <span style={{ color: '#00E5FF' }}>live</span></div>
              <div style={{ color: '#7B8BA0' }}>  ─────────────────────────</div>
              <div style={{ color: '#39FF14' }}>  🤖 Bot deployed in <span style={{ color: '#fff' }}>47s</span></div>
              <div style={{ color: '#00E5FF' }}>$ <span style={{ animation: 'itb-blink 1s step-end infinite', display: 'inline-block' }}>█</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────── */}
      <section style={{ padding: '100px 24px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(0,229,255,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <div className="itb-tag" style={{ marginBottom: 20 }}>Start Free</div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 20px' }}>
            Ready to deploy your <span className="itb-gradient-text">first intelligent bot?</span>
          </h2>
          <p style={{ color: '#7B8BA0', fontSize: '1rem', marginBottom: 40 }}>
            Free plan includes 1 bot, 50 documents, and unlimited messages. No credit card required.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/register" className="itb-btn-primary" style={{ fontSize: '1.05rem', padding: '14px 32px' }}>
              Get Started Free →
            </Link>
            <Link to="/pricing" className="itb-btn-ghost" style={{ fontSize: '1.05rem', padding: '14px 32px' }}>
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(0,229,255,0.08)', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#E8EDF5' }}>
            Info<span style={{ color: '#00E5FF' }}>To</span>Bot
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Features', 'Pricing', 'Login'].map(l => (
              <Link key={l} to={`/${l.toLowerCase()}`} style={{ color: '#4A5568', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#00E5FF'}
                onMouseLeave={e => e.target.style.color = '#4A5568'}
              >{l}</Link>
            ))}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#2D3550' }}>
            © 2026 InfoToBot Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}
