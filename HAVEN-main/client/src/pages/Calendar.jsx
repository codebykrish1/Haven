import React, { useEffect, useState } from 'react';
import { getCalendar } from '../api';
import { useTheme } from '../context/ThemeContext';

const COLOR_DARK  = { green: '#166534', red: '#7f1d1d', gold: '#78350f', grey: 'rgba(15,23,42,0.4)' };
const COLOR_LIGHT = { green: '#bbf7d0', red: '#fecaca', gold: '#fef08a', grey: 'rgba(255,228,230,0.5)' };
const TEXT_DARK   = { green: '#4ade80', red: '#f87171', gold: '#fbbf24', grey: '#334155' };
const TEXT_LIGHT  = { green: '#14532d', red: '#991b1b', gold: '#713f12', grey: '#c0202e' };

export default function Calendar() {
  const { dark } = useTheme();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [data, setData]   = useState(null);

  const load = () => getCalendar(month, year).then((r) => setData(r.data));
  useEffect(() => { load(); }, [month, year]);

  const COLOR = dark ? COLOR_DARK : COLOR_LIGHT;
  const TEXT  = dark ? TEXT_DARK  : TEXT_LIGHT;
  const mainText = dark ? '#f1f5f9' : '#1a0a0a';
  const subText  = dark ? '#64748b'  : '#c0202e';
  const card = {
    background: dark ? 'rgba(10,10,10,0.8)' : 'linear-gradient(135deg,#ffe4e6,#fecdd3)',
    border: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(226,55,68,0.25)',
    borderRadius: 12, padding: '14px 18px',
  };
  const btnStyle = {
    width: 36, height: 36, borderRadius: 8,
    border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(226,55,68,0.3)',
    background: 'transparent', color: dark ? '#94a3b8' : '#c0202e', cursor: 'pointer', fontSize: 16,
  };
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px' }}>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4, color: mainText }}>Income Calendar</div>
      <div style={{ fontSize: 14, color: subText, marginBottom: 28 }}>Track your earnings and disruption days.</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button style={btnStyle} onClick={() => { const d = new Date(year, month - 2); setMonth(d.getMonth() + 1); setYear(d.getFullYear()); }}>‹</button>
        <div style={{ fontSize: 18, fontWeight: 700, minWidth: 160, textAlign: 'center', color: mainText }}>{monthName} {year}</div>
        <button style={btnStyle} onClick={() => { const d = new Date(year, month); setMonth(d.getMonth() + 1); setYear(d.getFullYear()); }}>›</button>
      </div>

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 6 }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: subText, padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 24 }}>
            {data.calendar.map((d) => (
              <div key={d.date} style={{
                background: COLOR[d.color] || COLOR.grey,
                borderRadius: 10, padding: '10px 8px', textAlign: 'center', minHeight: 70,
                border: `1px solid ${d.color !== 'grey' ? 'rgba(255,255,255,0.08)' : (dark ? 'rgba(51,65,85,0.3)' : 'rgba(253,164,175,0.4)')}`,
                transition: 'transform .1s', cursor: 'default',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT[d.color] || TEXT.grey, marginBottom: 4 }}>{d.day}</div>
                <div style={{ fontSize: 11, color: TEXT[d.color] || TEXT.grey, opacity: 0.85 }}>{d.earned !== '₹0' ? d.earned : ''}</div>
                {d.disruption && <div style={{ fontSize: 9, color: TEXT.red, marginTop: 2 }}>{d.disruption.type}</div>}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
            {[
              { label: '🟢 Days Worked',  value: data.summary.green_days,   color: dark ? '#4ade80' : '#14532d' },
              { label: '🔴 Disrupted',    value: data.summary.red_days,     color: dark ? '#f87171' : '#991b1b' },
              { label: '🟡 Payouts',      value: data.summary.gold_days,    color: dark ? '#fbbf24' : '#713f12' },
              { label: '💰 Total Earned', value: data.summary.total_earned, color: dark ? '#ff4d5a' : '#c0202e' },
            ].map(({ label, value, color }) => (
              <div key={label} style={card}>
                <div style={{ fontSize: 12, color: subText, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

