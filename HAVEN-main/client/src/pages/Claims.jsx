import React, { useEffect, useState } from 'react';
import { getMyClaims, quickClaim, approveClaim, payClaim } from '../api';
import { useTheme } from '../context/ThemeContext';

const STATUS = {
  PENDING:  { bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24', border: 'rgba(251,191,36,0.2)'  },
  APPROVED: { bg: 'rgba(226,55,68,0.1)',   color: '#ff4d5a', border: 'rgba(226,55,68,0.2)'   },
  PAID:     { bg: 'rgba(34,197,94,0.1)',   color: '#4ade80', border: 'rgba(34,197,94,0.2)'   },
  FLAGGED:  { bg: 'rgba(239,68,68,0.1)',   color: '#f87171', border: 'rgba(239,68,68,0.2)'   },
};

export default function Claims() {
  const { dark } = useTheme();
  const [claims, setClaims] = useState([]);
  const [gps, setGps] = useState({ latitude: '', longitude: '' });
  const [msg, setMsg] = useState({ text: '', ok: true });
  const [loading, setLoading] = useState(false);

  const card = {
    background: dark ? 'rgba(10,10,10,0.8)' : 'linear-gradient(135deg,#ffe4e6,#fecdd3)',
    border: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(226,55,68,0.25)',
    borderRadius: 16, padding: 24,
  };
  const inputStyle = {
    width: '100%', padding: '10px 13px', borderRadius: 10,
    border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(226,55,68,0.3)',
    background: dark ? 'rgba(6,11,24,0.6)' : 'rgba(255,255,255,0.7)',
    color: dark ? '#f1f5f9' : '#1a0a0a', fontSize: 13, outline: 'none', marginBottom: 0,
  };
  const mainText = dark ? '#f1f5f9' : '#1a0a0a';
  const subText  = dark ? '#64748b'  : '#c0202e';

  const load = () => getMyClaims().then((r) => setClaims(r.data.claims));
  useEffect(() => { load(); }, []);

  const handleQuickClaim = async (e) => {
    e.preventDefault(); setMsg({ text: '', ok: true }); setLoading(true);
    try { const r = await quickClaim(gps); setMsg({ text: r.data.message, ok: true }); load(); }
    catch (e) { setMsg({ text: e.response?.data?.error || 'Error', ok: false }); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px' }}>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4, color: mainText }}>Claims</div>
      <div style={{ fontSize: 14, color: subText, marginBottom: 28 }}>File and manage your insurance claims.</div>

      <div style={{ ...card, border: dark ? '1px solid rgba(226,55,68,0.2)' : '1px solid rgba(226,55,68,0.35)', marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: mainText }}>⚡ Quick Claim</div>
        <div style={{ fontSize: 13, color: subText, marginBottom: 20 }}>File a claim instantly using your GPS location.</div>
        {msg.text && (
          <div style={{ background: msg.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: msg.ok ? '#4ade80' : '#f87171' }}>{msg.text}</div>
        )}
        <form onSubmit={handleQuickClaim} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: subText, marginBottom: 6 }}>Latitude</label>
            <input style={inputStyle} type="number" step="any" value={gps.latitude} onChange={(e) => setGps({ ...gps, latitude: e.target.value })} required placeholder="e.g. 19.0760" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: subText, marginBottom: 6 }}>Longitude</label>
            <input style={inputStyle} type="number" step="any" value={gps.longitude} onChange={(e) => setGps({ ...gps, longitude: e.target.value })} required placeholder="e.g. 72.8777" />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#E23744,#ff4d5a)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {loading ? 'Filing…' : 'File Claim'}
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {claims.length === 0 && <div style={{ ...card, textAlign: 'center', color: subText }}>No claims yet.</div>}
        {claims.map((c) => {
          const sc = STATUS[c.status] || STATUS.PENDING;
          return (
            <div key={c.claim_id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: mainText }}>{c.event_type || 'Manual Claim'}</span>
                  <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{c.status}</span>
                </div>
                <div style={{ fontSize: 12, color: subText }}>{c.city && `${c.city} · `}{c.coverage_tier} · Filed {new Date(c.created_at).toLocaleDateString()}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: mainText }}>₹{c.claim_amount}</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  {c.status === 'PENDING' && <button onClick={() => approveClaim(c.claim_id).then(load)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(34,197,94,0.15)', color: '#4ade80', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Approve</button>}
                  {c.status === 'APPROVED' && <button onClick={() => payClaim(c.claim_id).then(load)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(226,55,68,0.15)', color: '#ff4d5a', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Pay Out</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

