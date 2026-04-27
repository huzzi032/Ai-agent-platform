import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" fill="rgba(0,229,255,0.15)" stroke="#00E5FF" strokeWidth="1.2"/>
    <path d="M5 8l2 2 4-4" stroke="#00E5FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    badge: null,
    monthlyPrice: 0,
    yearlyPrice: 0,
    desc: 'Perfect for trying out Info To Bot with personal projects.',
    color: '#7B8BA0',
    borderColor: 'rgba(0,229,255,0.1)',
    ctaLabel: 'Get Started Free',
    ctaStyle: 'ghost',
    features: [
      '1 active bot',
      '50 document uploads',
      'Web widget only',
      'Basic analytics',
      '1,000 messages / mo',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Most Popular',
    monthlyPrice: 29,
    yearlyPrice: 23,
    desc: 'For growing teams that need multi-channel bots and real analytics.',
    color: '#00E5FF',
    borderColor: '#00E5FF',
    ctaLabel: 'Start Pro Trial',
    ctaStyle: 'primary',
    features: [
      '10 active bots',
      'Unlimited documents',
      'WhatsApp + Telegram + Web',
      'Advanced analytics dashboard',
      '100,000 messages / mo',
      'Priority email support',
      'Auto-retraining pipeline',
      'Custom bot personas',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: null,
    monthlyPrice: 99,
    yearlyPrice: 79,
    desc: 'For large-scale deployments with custom integrations and SLAs.',
    color: '#39FF14',
    borderColor: 'rgba(57,255,20,0.3)',
    ctaLabel: 'Contact Sales',
    ctaStyle: 'green',
    features: [
      'Unlimited bots',
      'Unlimited documents',
      'All platforms + custom API',
      'Real-time monitoring',
      'Unlimited messages',
      'Dedicated SLA support',
      'SSO / SAML',
      'Custom integrations',
      'Audit logs & compliance',
    ],
  },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="itb-root itb-grid-bg" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      <PublicNavbar />

      {/* ── HEADER ────────────────────────── */}
      <section style={{ padding: '140px 24px 80px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div className="itb-tag" style={{ marginBottom: 20 }}>Pricing</div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 16px' }}>
            Simple, transparent <span className="itb-gradient-text">pricing</span>
          </h1>
          <p style={{ color: '#7B8BA0', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto 40px' }}>
            Start free. Scale as your bot fleet grows. No hidden fees, no per-seat pricing.
          </p>

          {/* Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(26,32,53,0.8)', border: '1px solid rgba(0,229,255,0.1)', borderRadius: 99, padding: '6px 16px' }}>
            <span style={{ color: !yearly ? '#E8EDF5' : '#4A5568', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => setYearly(false)}>Monthly</span>
            <button
              onClick={() => setYearly(!yearly)}
              style={{
                width: 44, height: 24, borderRadius: 12,
                background: yearly ? '#00E5FF' : 'rgba(0,229,255,0.15)',
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s'
              }}
            >
              <span style={{
                position: 'absolute', top: 3, left: yearly ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                transition: 'left 0.3s', display: 'block'
              }} />
            </button>
            <span style={{ color: yearly ? '#E8EDF5' : '#4A5568', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => setYearly(true)}>
              Yearly <span style={{ color: '#39FF14', fontSize: '0.75rem', marginLeft: 4 }}>-20%</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── PLAN CARDS ────────────────────── */}
      <section style={{ padding: '0 24px 100px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, alignItems: 'start' }}>
          {plans.map((plan) => {
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            const isPro = plan.id === 'pro';
            return (
              <div key={plan.id} style={{
                background: 'var(--itb-panel)',
                border: `1px solid ${plan.borderColor}`,
                borderRadius: 20,
                padding: '32px 28px',
                position: 'relative',
                transform: isPro ? 'scale(1.03)' : 'scale(1)',
                boxShadow: isPro ? `0 0 40px rgba(0,229,255,0.12), 0 20px 60px rgba(0,0,0,0.4)` : 'none',
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}>
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: '#00E5FF', color: '#080B14',
                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', fontWeight: 700,
                    padding: '4px 16px', borderRadius: 99, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap'
                  }}>{plan.badge}</div>
                )}

                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontFamily: 'JetBrains Mono, monospace', color: plan.color, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                    {plan.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, margin: '0 0 12px' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '3rem', fontWeight: 700, color: '#E8EDF5', lineHeight: 1 }}>
                      {price === 0 ? 'Free' : `$${price}`}
                    </span>
                    {price > 0 && <span style={{ color: '#4A5568', fontSize: '0.9rem', paddingBottom: 6 }}>/ mo</span>}
                  </div>
                  <p style={{ color: '#7B8BA0', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>{plan.desc}</p>
                </div>

                <div className="itb-divider" style={{ margin: '20px 0' }} />

                <ul style={{ listStyle: 'none', margin: '0 0 28px', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#C4CFDE', fontSize: '0.88rem' }}>
                      <Check />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.ctaStyle === 'primary' && (
                  <Link to="/register" className="itb-btn-primary" style={{ width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
                    {plan.ctaLabel}
                  </Link>
                )}
                {plan.ctaStyle === 'ghost' && (
                  <Link to="/register" className="itb-btn-ghost" style={{ width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
                    {plan.ctaLabel}
                  </Link>
                )}
                {plan.ctaStyle === 'green' && (
                  <Link to="/register" className="itb-btn-green" style={{ width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
                    {plan.ctaLabel}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── COMPARISON TABLE ──────────────── */}
      <section style={{ padding: '0 24px 100px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.6rem', fontWeight: 700, marginBottom: 40, letterSpacing: '-0.02em' }}>
            Full <span className="itb-gradient-text">feature comparison</span>
          </h2>
          <div className="itb-card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Space Grotesk, sans-serif' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', color: '#7B8BA0', fontWeight: 500, fontSize: '0.85rem' }}>Feature</th>
                  {['Starter', 'Pro', 'Enterprise'].map(p => (
                    <th key={p} style={{ padding: '16px 20px', textAlign: 'center', color: '#E8EDF5', fontWeight: 600, fontSize: '0.88rem' }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Active Bots', '1', '10', 'Unlimited'],
                  ['Documents', '50', 'Unlimited', 'Unlimited'],
                  ['Messages / mo', '1,000', '100,000', 'Unlimited'],
                  ['Platforms', 'Web only', 'WA + TG + Web', 'All + Custom'],
                  ['Analytics', 'Basic', 'Advanced', 'Real-time'],
                  ['Auto-retrain', '—', '✓', '✓'],
                  ['SSO', '—', '—', '✓'],
                  ['Support', 'Community', 'Email priority', 'Dedicated SLA'],
                ].map(([feat, s, p, e], i) => (
                  <tr key={feat} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '14px 20px', color: '#C4CFDE', fontSize: '0.88rem' }}>{feat}</td>
                    {[s, p, e].map((val, j) => (
                      <td key={j} style={{ padding: '14px 20px', textAlign: 'center', fontSize: '0.85rem',
                        color: val === '—' ? '#2D3550' : val === '✓' ? '#39FF14' : j === 1 ? '#00E5FF' : '#7B8BA0',
                        fontFamily: val === '✓' ? 'inherit' : 'JetBrains Mono, monospace'
                      }}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(0,229,255,0.08)', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ color: '#2D3550', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem' }}>
          © 2026 InfoToBot Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
