import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api';
import { useTheme } from '../context/ThemeContext';

const STATUS_META = {
  PAID:     { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Paid'     },
  PENDING:  { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Pending'  },
  APPROVED: { color: '#E23744', bg: '#fff1f2', border: '#fecdd3', label: 'Approved' },
  FLAGGED:  { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Flagged'  },
};
const STATUS_META_DARK = {
  PAID:     { color: '#4ade80', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.2)',  label: 'Paid'     },
  PENDING:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', label: 'Pending'  },
  APPROVED: { color: '#ff4d5a', bg: 'rgba(226,55,68,0.1)',  border: 'rgba(226,55,68,0.2)',  label: 'Approved' },
  FLAGGED:  { color: '#f87171', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  label: 'Flagged'  },
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const { dark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => { getDashboard().then((r) => setData(r.data)); }, []);

  const c = {
    pageBg:  dark ? '#0a0a0a' : '#f8f5ff',
    card:    dark ? '#141414' : '#ffffff',
    cardB:   dark ? 'rgba(255,255,255,0.08)' : 'rgba(192,32,46,0.12)',
    text:    dark ? '#f1f5f9' : '#1a0a0a',
    sub:     dark ? '#64748b' : '#9f1239',
    muted:   dark ? '#334155' : '#ff4d5a',
    divider: dark ? 'rgba(255,255,255,0.06)' : 'rgba(192,32,46,0.08)',
  };

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0505' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '3px solid #E23744', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading your dashboard</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const { worker, active_policy, stats, recent_claims } = data;
  const riskScore = worker.risk_score;
  const riskColor = riskScore < 30 ? '#4ade80' : riskScore > 70 ? '#f87171' : '#fbbf24';
  const riskLabel = riskScore < 30 ? 'Low Risk' : riskScore > 70 ? 'High Risk' : 'Moderate';
  const SM = dark ? STATUS_META_DARK : STATUS_META;

  const statCards = [
    { label: 'Total Policies',   value: stats.total_policies,         accent: '#E23744' },
    { label: 'Paid Claims',      value: stats.paid_claims,            accent: '#16a34a' },
    { label: 'Pending Claims',   value: stats.pending_claims,         accent: '#d97706' },
    { label: 'Income Protected', value: stats.total_income_protected, accent: '#c0202e' },
    { label: 'Approved Claims',  value: stats.approved_claims,        accent: '#0891b2' },
    { label: 'Flagged Claims',   value: stats.flagged_claims,         accent: '#dc2626' },
  ];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dash-hero-btn:hover { opacity: 0.85 !important; }
        .stat-card:hover { transform: translateY(-3px) !important; }
        .claim-row:hover { background: ${dark ? 'rgba(255,255,255,0.03)' : 'rgba(192,32,46,0.04)'} !important; }
      `}</style>

      {/* ── HERO — full viewport height ── */}
      <div style={{
        minHeight: 'calc(100vh - 72px)',
        background: '#0f0505',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        margin: '0 -40px',
        padding: '0 40px',
      }}>
        {/* dot grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(226,55,68,0.07) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />
        {/* radial glow right */}
        <div style={{ position: 'absolute', right: -100, top: '50%', transform: 'translateY(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(226,55,68,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
        {/* radial glow left */}
        <div style={{ position: 'absolute', left: -100, bottom: 0, width: 400, height: 400, background: 'radial-gradient(circle, rgba(226,55,68,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 40, flexWrap: 'wrap', position: 'relative', animation: 'fadeUp 0.6s ease both' }}>

          {/* Left content */}
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,77,90,0.65)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            <div style={{ fontSize: 56, fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1.05, marginBottom: 12 }}>
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},
              <br />
              <span style={{ color: '#E23744' }}>{worker.full_name}</span>
            </div>

            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 36, fontWeight: 400 }}>
              {worker.platform}&nbsp;&nbsp;·&nbsp;&nbsp;{worker.city}&nbsp;&nbsp;·&nbsp;&nbsp;Zone {worker.zone_id}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Purchase Policy', path: '/policies', primary: true  },
                { label: 'File a Claim',    path: '/claims',   primary: false },
                { label: 'View Calendar',   path: '/calendar', primary: false },
              ].map(({ label, path, primary }) => (
                <button key={path} className="dash-hero-btn" onClick={() => navigate(path)} style={{
                  padding: '12px 26px', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  border: primary ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  background: primary ? '#E23744' : 'rgba(255,255,255,0.07)',
                  color: '#fff', transition: 'opacity .15s',
                  boxShadow: primary ? '0 6px 20px rgba(226,55,68,0.45)' : 'none',
                  letterSpacing: '0.01em',
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Right — Protection Score card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(226,55,68,0.2)',
            borderRadius: 20, padding: '32px 40px',
            backdropFilter: 'blur(16px)',
            minWidth: 260, textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,77,90,0.6)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Protection Score</div>
            <div style={{ fontSize: 72, fontWeight: 900, color: '#fff', letterSpacing: '-3px', lineHeight: 1 }}>
              {worker.gig_score}
              <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>/5</span>
            </div>
            <div style={{ margin: '20px 0 12px', height: 5, borderRadius: 5, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(worker.gig_score / 5) * 100}%`, background: 'linear-gradient(90deg,#E23744,#ff4d5a)', borderRadius: 5 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>Risk: {riskScore}</span>
              <span style={{ fontWeight: 700, color: riskColor }}>{riskLabel}</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.4 }}>
          <div style={{ fontSize: 11, color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Scroll</div>
          <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, #fff, transparent)' }} />
        </div>
      </div>

      {/* ── STATS SECTION — appears on scroll ── */}
      <div style={{ background: c.pageBg, padding: '48px 0 64px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Section label */}
          <div style={{ fontSize: 11, color: c.sub, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Overview</div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 14, marginBottom: 36 }}>
            {statCards.map(({ label, value, accent }) => (
              <div key={label} className="stat-card" style={{
                background: c.card, border: `1px solid ${c.cardB}`,
                borderRadius: 14, padding: '20px 22px',
                borderLeft: `3px solid ${accent}`,
                transition: 'transform .15s, box-shadow .15s',
                cursor: 'default',
              }}>
                <div style={{ fontSize: 11, color: c.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: c.text, letterSpacing: '-0.5px' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Bottom row */}
          <div style={{ display: 'grid', gridTemplateColumns: active_policy ? '380px 1fr' : '1fr', gap: 18 }}>

            {/* Active Policy */}
            {active_policy && (
              <div style={{ background: c.card, border: `1px solid ${c.cardB}`, borderRadius: 16, padding: 26, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
                  <div>
                    <div style={{ fontSize: 11, color: c.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Active Policy</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: c.text }}>{active_policy.coverage_tier}</div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 6, background: dark ? 'rgba(34,197,94,0.1)' : '#f0fdf4', color: '#16a34a', fontSize: 11, fontWeight: 700, border: `1px solid ${dark ? 'rgba(34,197,94,0.2)' : '#bbf7d0'}` }}>ACTIVE</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { k: 'Coverage Amount', v: `₹${active_policy.coverage_amount}`, accent: '#c0202e' },
                    { k: 'Weekly Premium',  v: `₹${active_policy.premium_amount}`,  accent: '#E23744' },
                  ].map(({ k, v, accent }) => (
                    <div key={k} style={{ background: dark ? 'rgba(255,255,255,0.04)' : '#fff5f5', borderRadius: 10, padding: '14px 16px', border: `1px solid ${c.divider}` }}>
                      <div style={{ fontSize: 11, color: c.sub, marginBottom: 5 }}>{k}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: accent }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: c.sub, padding: '10px 14px', background: dark ? 'rgba(255,255,255,0.03)' : '#fff5f5', borderRadius: 8, border: `1px solid ${c.divider}`, marginBottom: 16 }}>
                  Valid: <strong style={{ color: c.text }}>{active_policy.week_start_date}</strong> to <strong style={{ color: c.text }}>{active_policy.week_end_date}</strong>
                </div>
                <button onClick={() => navigate('/policies')} style={{ marginTop: 'auto', padding: '10px', borderRadius: 9, border: `1px solid ${c.cardB}`, background: 'transparent', color: c.sub, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Manage Policies</button>
              </div>
            )}

            {/* Recent Claims */}
            <div style={{ background: c.card, border: `1px solid ${c.cardB}`, borderRadius: 16, padding: 26 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <div>
                  <div style={{ fontSize: 11, color: c.sub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>Recent Claims</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c.text }}>{recent_claims.length} Record{recent_claims.length !== 1 ? 's' : ''}</div>
                </div>
                <button onClick={() => navigate('/claims')} style={{ padding: '7px 16px', borderRadius: 8, border: `1px solid ${c.cardB}`, background: 'transparent', color: c.sub, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>View All</button>
              </div>

              {recent_claims.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: dark ? 'rgba(255,255,255,0.04)' : '#fff5f5', border: `1px solid ${c.cardB}`, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${c.muted}` }} />
                  </div>
                  <div style={{ color: c.sub, fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No claims on record</div>
                  <div style={{ color: c.muted, fontSize: 12, marginBottom: 16 }}>File a claim when a disruption affects your work</div>
                  <button onClick={() => navigate('/claims')} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#E23744', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 14px rgba(226,55,68,0.35)' }}>File a Claim</button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 90px 90px', gap: 8, padding: '0 12px 10px', borderBottom: `1px solid ${c.divider}`, marginBottom: 4 }}>
                    {['Event', 'Amount', 'Date', 'Status'].map((h) => (
                      <div key={h} style={{ fontSize: 11, fontWeight: 600, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
                    ))}
                  </div>
                  {recent_claims.map((claim) => {
                    const sm = SM[claim.status] || SM.PENDING;
                    return (
                      <div key={claim.claim_id} className="claim-row" style={{ display: 'grid', gridTemplateColumns: '1fr 100px 90px 90px', gap: 8, padding: '11px 12px', borderRadius: 8, transition: 'background .12s', cursor: 'default' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{claim.event_type ? claim.event_type.charAt(0).toUpperCase() + claim.event_type.slice(1) : 'Manual'}</div>
                          <div style={{ fontSize: 11, color: c.sub, marginTop: 1 }}>{claim.city || 'N/A'}</div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: c.text, alignSelf: 'center' }}>₹{claim.claim_amount}</div>
                        <div style={{ fontSize: 12, color: c.sub, alignSelf: 'center' }}>{new Date(claim.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                        <div style={{ alignSelf: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: sm.bg, color: sm.color, border: `1px solid ${sm.border}` }}>{sm.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
