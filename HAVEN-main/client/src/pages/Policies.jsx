import React, { useEffect, useState } from 'react';
import { getMyPolicies, purchasePolicy, activateHourly, deactivateHourly, pausePolicy } from '../api';
import { useTheme } from '../context/ThemeContext';

const TIERS = [
  { id: 'BASIC', premium: 29, coverage: 1500, desc: 'Essential protection' },
  { id: 'STANDARD', premium: 59, coverage: 3000, desc: 'Balanced coverage' },
  { id: 'PREMIUM', premium: 99, coverage: 6000, desc: 'Maximum protection' },
];
const DISRUPTION_TYPES = ['rain', 'flood', 'heatwave', 'storm', 'strike', 'road_closure'];

export default function Policies() {
  const { dark } = useTheme();
  const [policies, setPolicies] = useState([]);
  const [form, setForm] = useState({ coverage_tier: 'BASIC', disruption_types: [], payment_txn_id: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const card = {
    background: dark ? 'rgba(10,10,10,0.8)' : 'linear-gradient(135deg,#ffe4e6,#fecdd3)',
    border: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(226,55,68,0.25)',
    borderRadius: 16, padding: 24,
  };
  const inputStyle = {
    width: '100%', padding: '10px 13px', borderRadius: 10,
    border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(226,55,68,0.3)',
    background: dark ? 'rgba(6,11,24,0.6)' : 'rgba(255,255,255,0.7)',
    color: dark ? '#f1f5f9' : '#1a0a0a', fontSize: 13, outline: 'none',
  };
  const mainText = dark ? '#f1f5f9' : '#1a0a0a';
  const subText  = dark ? '#64748b'  : '#c0202e';
  const divider  = dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(226,55,68,0.15)';

  const load = () => getMyPolicies().then((r) => setPolicies(r.data.policies));
  useEffect(() => { load(); }, []);

  const toggleType = (t) => setForm((f) => ({
    ...f,
    disruption_types: f.disruption_types.includes(t) ? f.disruption_types.filter((x) => x !== t) : [...f.disruption_types, t],
  }));

  const handlePurchase = async (e) => {
    e.preventDefault(); setErr(''); setMsg('');
    try {
      const r = await purchasePolicy(form);
      setMsg(`Policy purchased! 🔥 ${r.data.streak.current_streak} week streak`);
      load();
    } catch (e) { setErr(e.response?.data?.error || 'Error'); }
  };

  const STATUS_STYLE = {
    ACTIVE:    { color: '#4ade80', bg: 'rgba(34,197,94,0.1)'  },
    CANCELLED: { color: '#f87171', bg: 'rgba(239,68,68,0.1)'  },
    EXPIRED:   { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)'},
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px' }}>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4, color: mainText }}>Policies</div>
      <div style={{ fontSize: 14, color: subText, marginBottom: 28 }}>Purchase and manage your weekly coverage.</div>

      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: mainText }}>Purchase Policy</div>
        {err && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#f87171' }}>{err}</div>}
        {msg && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#4ade80' }}>{msg}</div>}

        <form onSubmit={handlePurchase}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            {TIERS.map((t) => {
              const active = form.coverage_tier === t.id;
              return (
                <div key={t.id} onClick={() => setForm({ ...form, coverage_tier: t.id })} style={{
                  border: `2px solid ${active ? 'rgba(192,32,46,0.7)' : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(226,55,68,0.2)')}`,
                  background: active ? (dark ? 'rgba(226,55,68,0.1)' : 'rgba(253,164,175,0.4)') : (dark ? 'rgba(6,11,24,0.4)' : 'rgba(255,255,255,0.4)'),
                  borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all .15s',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: active ? (dark ? '#ff4d5a' : '#c0202e') : subText, marginBottom: 4 }}>{t.id}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: mainText, marginBottom: 2 }}>₹{t.premium}<span style={{ fontSize: 12, fontWeight: 400, color: subText }}>/wk</span></div>
                  <div style={{ fontSize: 12, color: subText }}>Up to ₹{t.coverage}</div>
                  <div style={{ fontSize: 11, color: subText, marginTop: 4 }}>{t.desc}</div>
                </div>
              );
            })}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: subText, marginBottom: 10 }}>Covered Disruptions</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DISRUPTION_TYPES.map((t) => {
                const active = form.disruption_types.includes(t);
                return (
                  <span key={t} onClick={() => toggleType(t)} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    border: `1px solid ${active ? 'rgba(192,32,46,0.6)' : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(226,55,68,0.3)')}`,
                    background: active ? (dark ? 'rgba(226,55,68,0.12)' : 'rgba(253,164,175,0.5)') : 'transparent',
                    color: active ? (dark ? '#ff4d5a' : '#c0202e') : subText, transition: 'all .15s',
                  }}>{t}</span>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: subText, marginBottom: 6 }}>Payment Txn ID (optional)</label>
              <input style={inputStyle} value={form.payment_txn_id} onChange={(e) => setForm({ ...form, payment_txn_id: e.target.value })} placeholder="e.g. TXN123456" />
            </div>
            <button type="submit" style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#E23744,#ff4d5a)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>Purchase</button>
            <button type="button" onClick={() => activateHourly({ hourly_rate: 5 }).then(() => setMsg('Hourly coverage activated')).catch(e => setErr(e.response?.data?.error))} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)', color: '#4ade80', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>Activate Hourly</button>
            <button type="button" onClick={() => deactivateHourly().then(r => setMsg(r.data.message)).catch(e => setErr(e.response?.data?.error))} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.08)', color: '#fbbf24', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>Deactivate</button>
          </div>
        </form>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {policies.map((p) => {
          const ss = STATUS_STYLE[p.status] || STATUS_STYLE.EXPIRED;
          return (
            <div key={p.policy_id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: mainText }}>{p.coverage_tier}</span>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: ss.bg, color: ss.color }}>{p.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: subText, marginTop: 4 }}>{p.week_start_date} → {p.week_end_date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: mainText }}>₹{p.coverage_amount}</div>
                  <div style={{ fontSize: 12, color: subText }}>₹{p.premium_amount}/wk</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: subText, borderTop: divider, paddingTop: 10 }}>
                Covers: {Array.isArray(p.disruption_types) ? p.disruption_types.join(', ') : p.disruption_types}
              </div>
              {p.status === 'ACTIVE' && (
                <button onClick={() => pausePolicy(p.policy_id, {}).then(load).catch(e => setErr(e.response?.data?.error))} style={{ marginTop: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Pause Policy</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

