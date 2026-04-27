import React from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';

const features = [
  {
    icon: '⬡',
    title: 'RAG Knowledge Engine',
    tag: 'Core',
    tagColor: '#00E5FF',
    bullets: [
      'Semantic chunking & overlap control',
      'Multi-format ingestion: PDF, DOCX, CSV, TXT, URLs',
      'OpenAI + local embedding model support',
      'Hybrid BM25 + vector retrieval',
      'Auto-deduplication on re-upload',
    ],
    visual: (
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', lineHeight: 2.2, color: '#4A5568' }}>
        <div><span style={{ color: '#00E5FF' }}>CHUNK</span>  → embed → <span style={{ color: '#39FF14' }}>store</span></div>
        <div><span style={{ color: '#00E5FF' }}>QUERY</span>  → search → <span style={{ color: '#39FF14' }}>rank</span></div>
        <div><span style={{ color: '#00E5FF' }}>ANSWER</span> → stream → <span style={{ color: '#39FF14' }}>deliver</span></div>
      </div>
    ),
  },
  {
    icon: '◈',
    title: 'Multi-Platform Deployment',
    tag: 'Integrations',
    tagColor: '#39FF14',
    bullets: [
      'WhatsApp Business API',
      'Telegram Bot API',
      'Instagram Direct Messages',
      'Gmail auto-responder',
      'Embeddable web widget (<script> tag)',
    ],
    visual: (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {['WhatsApp', 'Telegram', 'Instagram', 'Gmail', 'Web Widget'].map(p => (
          <span key={p} style={{ padding: '4px 10px', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.15)', borderRadius: 6, fontSize: '0.72rem', color: '#00E5FF', fontFamily: 'JetBrains Mono, monospace' }}>{p}</span>
        ))}
      </div>
    ),
  },
  {
    icon: '◉',
    title: 'Real-Time Analytics',
    tag: 'Insights',
    tagColor: '#FFB800',
    bullets: [
      'Live message volume graphs',
      'Per-bot accuracy & confidence scores',
      'Response latency heatmaps',
      'Top unanswered queries',
      'Export to CSV / JSON',
    ],
    visual: (
      <svg viewBox="0 0 180 60" style={{ width: '100%', height: 60 }}>
        {[30, 50, 40, 70, 55, 80, 65].map((h, i) => (
          <rect key={i} x={i * 26 + 2} y={60 - h * 0.7} width="18" height={h * 0.7} rx="3"
            fill={`rgba(0,229,255,${0.3 + i * 0.1})`} />
        ))}
      </svg>
    ),
  },
  {
    icon: '⬟',
    title: 'Zero-Code Integration',
    tag: 'Developer',
    tagColor: '#7C3AED',
    bullets: [
      'One-line <script> embed',
      'REST API with OpenAPI docs',
      'WordPress plugin download',
      'Shopify & Webflow compatible',
      'Webhook event delivery',
    ],
    visual: (
      <div style={{ background: '#0D1117', borderRadius: 8, padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#7B8BA0' }}>
        <span style={{ color: '#4A5568' }}>&lt;</span>
        <span style={{ color: '#00E5FF' }}>script</span>
        <span style={{ color: '#4A5568' }}>&gt;</span><br />
        &nbsp;&nbsp;<span style={{ color: '#39FF14' }}>ITB</span>.init(<span style={{ color: '#FFB800' }}>&#39;your-key&#39;</span>);<br />
        <span style={{ color: '#4A5568' }}>&lt;/</span>
        <span style={{ color: '#00E5FF' }}>script</span>
        <span style={{ color: '#4A5568' }}>&gt;</span>
      </div>
    ),
  },
  {
    icon: '◆',
    title: 'Auto-Training Pipeline',
    tag: 'Automation',
    tagColor: '#00E5FF',
    bullets: [
      'Watch folder or S3 bucket for new docs',
      'Incremental indexing — only changed files',
      'Version history for rollback',
      'Training status webhooks',
      'Scheduled re-index jobs',
    ],
    visual: (
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: '#4A5568', lineHeight: 2 }}>
        <div><span style={{ color: '#39FF14' }}>●</span> Doc uploaded → trigger</div>
        <div><span style={{ color: '#FFB800' }}>●</span> Diff detected → re-embed</div>
        <div><span style={{ color: '#00E5FF' }}>●</span> Index updated → live</div>
      </div>
    ),
  },
  {
    icon: '⬡',
    title: 'Enterprise Security',
    tag: 'Security',
    tagColor: '#FF3B5C',
    bullets: [
      'AES-256 encrypted vector stores',
      'Role-based access control',
      'SSO / SAML 2.0 support',
      'Full audit log trail',
      'SOC2 Type II roadmap',
    ],
    visual: (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['AES-256', 'RBAC', 'SAML 2.0', 'SOC2'].map(p => (
          <span key={p} style={{ padding: '4px 10px', background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.2)', borderRadius: 6, fontSize: '0.72rem', color: '#FF3B5C', fontFamily: 'JetBrains Mono, monospace' }}>{p}</span>
        ))}
      </div>
    ),
  },
];

export default function FeaturesPage() {
  return (
    <div className="itb-root itb-grid-bg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      <PublicNavbar />

      {/* ── HEADER ────────────────────────── */}
      <section style={{ padding: '140px 24px 80px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div className="itb-tag" style={{ marginBottom: 20 }}>Capabilities</div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
            Built for <span className="itb-gradient-text">production-grade</span> bot deployment
          </h1>
          <p style={{ color: '#7B8BA0', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto' }}>
            Every feature engineered for reliability, speed, and scale — not demos.
          </p>
        </div>
      </section>

      {/* ── FEATURE CARDS ─────────────────── */}
      <section style={{ padding: '0 24px 100px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {features.map((feat, i) => (
            <div key={i} className="itb-card" style={{ padding: '36px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
              <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <span style={{ fontSize: '1.8rem' }}>{feat.icon}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: feat.tagColor, border: `1px solid ${feat.tagColor}30`, background: `${feat.tagColor}12`, padding: '3px 10px', borderRadius: 99, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{feat.tag}</span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 20px', letterSpacing: '-0.02em', color: '#E8EDF5' }}>{feat.title}</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {feat.bullets.map((b, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#7B8BA0', fontSize: '0.92rem' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: feat.tagColor, flexShrink: 0, display: 'inline-block' }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ order: i % 2 === 0 ? 1 : 0, background: 'rgba(13,17,23,0.6)', borderRadius: 12, padding: 28, border: '1px solid rgba(255,255,255,0.04)' }}>
                {feat.visual}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────── */}
      <section style={{ padding: '80px 24px 100px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 16, letterSpacing: '-0.025em' }}>
            See it all in <span className="itb-gradient-text">your dashboard</span>
          </h2>
          <p style={{ color: '#7B8BA0', marginBottom: 36 }}>Start free — no credit card needed.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
            <Link to="/register" className="itb-btn-primary">Deploy Free Bot →</Link>
            <Link to="/pricing" className="itb-btn-ghost">View Pricing</Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(0,229,255,0.08)', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: '#2D3550', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>© 2026 InfoToBot Inc.</p>
      </footer>
    </div>
  );
}
