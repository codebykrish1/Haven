import React, { useEffect, useState } from 'react';
import { getBadges } from '../api';
import { useTheme } from '../context/ThemeContext';

export default function Badges() {
  const { dark } = useTheme();
  const [data, setData] = useState(null);
  useEffect(() => { getBadges().then((r) => setData(r.data)); }, []);

  const card = {
    background: dark ? 'rgba(10,10,10,0.8)' : 'linear-gradient(135deg,#ffe4e6,#fecdd3)',
    border: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(226,55,68,0.25)',
    borderRadius: 16, padding: 24,
  };
  const mainText = dark ? '#f1f5f9' : '#1a0a0a';
  const subText  = dark ? '#64748b'  : '#c0202e';
  const divider  = dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(226,55,68,0.15)';

  if (!data) return <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px', color: subText }}>Loading…</div>;
  const { worker, current_badge, next_badge, stats, all_badges } = data;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px' }}>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4, color: mainText }}>Badges & GigScore</div>
      <div style={{ fontSize: 14, color: subText, marginBottom: 28 }}>Your loyalty rewards and protection milestones.</div>

      {/* GigScore hero */}
      <div style={{ background: dark ? 'linear-gradient(135deg,rgba(226,55,68,0.15),rgba(192,32,46,0.1))' : 'linear-gradient(135deg,#fda4af,#ff4d5a)', border: dark ? '1px solid rgba(226,55,68,0.25)' : '1px solid rgba(192,32,46,0.3)', borderRadius: 20, padding: 28, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: dark ? '#94a3b8' : '#7f1d1d', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your GigScore</div>
          <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', color: dark ? '#f1f5f9' : '#1a0a0a' }}>⭐ {worker.gig_score}</div>
          <div style={{ fontSize: 13, color: dark ? '#64748b' : '#c0202e', marginTop: 6 }}>Risk score: {worker.risk_score} · {worker.platform} · {worker.city}</div>
        </div>
        {current_badge && (
          <div style={{ textAlign: 'center', background: dark ? 'rgba(226,55,68,0.1)' : 'rgba(255,255,255,0.4)', borderRadius: 16, padding: '20px 28px' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{current_badge.emoji}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: mainText }}>{current_badge.name}</div>
            <div style={{ fontSize: 11, color: subText, marginTop: 4 }}>{current_badge.benefit}</div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 24 }}>
        {[['Weeks Covered', stats.total_weeks_covered], ['Current Streak', `🔥 ${stats.current_streak}`], ['Total Claims', stats.total_claims], ['Paid Claims', stats.paid_claims], ['Income Protected', stats.total_income_protected]].map(([k, v]) => (
          <div key={k} style={card}>
            <div style={{ fontSize: 11, color: subText, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: mainText }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Badge cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
        {all_badges.map((b) => (
          <div key={b.level} style={{
            background: b.unlocked ? (dark ? 'linear-gradient(135deg,rgba(226,55,68,0.12),rgba(192,32,46,0.08))' : 'linear-gradient(135deg,#fda4af,#ff4d5a)') : (dark ? 'rgba(15,23,42,0.4)' : 'rgba(255,228,230,0.4)'),
            border: `1px solid ${b.unlocked ? (dark ? 'rgba(226,55,68,0.3)' : 'rgba(192,32,46,0.4)') : (dark ? 'rgba(51,65,85,0.3)' : 'rgba(253,164,175,0.4)')}`,
            borderRadius: 16, padding: 24, textAlign: 'center', opacity: b.unlocked ? 1 : 0.6,
          }}>
            <div style={{ fontSize: 44, marginBottom: 12, filter: b.unlocked ? 'none' : 'grayscale(1)' }}>{b.emoji}</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: mainText }}>{b.name}</div>
            <div style={{ fontSize: 12, color: subText, marginBottom: 8 }}>{b.benefit}</div>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: b.unlocked ? 'rgba(34,197,94,0.15)' : (dark ? 'rgba(51,65,85,0.3)' : 'rgba(253,164,175,0.5)'), color: b.unlocked ? '#4ade80' : subText }}>
              {b.unlocked ? 'Unlocked' : 'Locked'}
            </span>
          </div>
        ))}
      </div>

      {next_badge && (
        <div style={{ background: dark ? 'rgba(251,191,36,0.06)' : 'rgba(255,228,230,0.6)', border: dark ? '1px solid rgba(251,191,36,0.15)' : '1px solid rgba(226,55,68,0.3)', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: subText }}>
          Next: {next_badge.emoji} <strong style={{ color: dark ? '#fbbf24' : '#c0202e' }}>{next_badge.name}</strong> — {next_badge.requirement}
        </div>
      )}
    </div>
  );
}

