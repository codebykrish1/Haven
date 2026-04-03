import React, { useEffect, useState } from 'react';
import { triggerSOS, getMySOSEvents, resolveSOS } from '../api';
import { useTheme } from '../context/ThemeContext';

export default function SOS() {
  const { dark } = useTheme();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ latitude: '', longitude: '', message: '', emergency_contact: '' });
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
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
    color: dark ? '#f1f5f9' : '#1a0a0a', fontSize: 13, outline: 'none',
  };
  const mainText = dark ? '#f1f5f9' : '#1a0a0a';
  const subText  = dark ? '#64748b'  : '#c0202e';
  const divider  = dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(226,55,68,0.15)';

  const load = () => getMySOSEvents().then((r) => setEvents(r.data.sos_events));
  useEffect(() => { load(); }, []);

  const handleSOS = async (e) => {
    e.preventDefault(); setErr(''); setResult(null); setLoading(true);
    try { const r = await triggerSOS(form); setResult(r.data); load(); }
    catch (e) { setErr(e.response?.data?.error || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px' }}>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4, color: mainText }}>SOS Emergency</div>
      <div style={{ fontSize: 14, color: subText, marginBottom: 28 }}>Trigger emergency assistance and find nearby shelters.</div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ ...card, border: dark ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(239,68,68,0.3)' }}>
          {err && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#f87171' }}>{err}</div>}
          <form onSubmit={handleSOS}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              {[{ name: 'latitude', label: 'Latitude', placeholder: '19.0760' }, { name: 'longitude', label: 'Longitude', placeholder: '72.8777' }].map(({ name, label, placeholder }) => (
                <div key={name}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: subText, marginBottom: 6 }}>{label}</label>
                  <input style={inputStyle} type="number" step="any" value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} required placeholder={placeholder} />
                </div>
              ))}
            </div>
            {[{ name: 'message', label: 'Message (optional)', placeholder: 'Describe your situation…' }, { name: 'emergency_contact', label: 'Emergency Contact (optional)', placeholder: '+91 98765 43210' }].map(({ name, label, placeholder }) => (
              <div key={name} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: subText, marginBottom: 6 }}>{label}</label>
                <input style={inputStyle} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} placeholder={placeholder} />
              </div>
            ))}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: loading ? '#334155' : 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontWeight: 700, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Activating…' : '🆘 TRIGGER SOS'}
            </button>
          </form>
        </div>

        {result && (
          <div style={{ ...card, border: dark ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(239,68,68,0.3)' }}>
            <div style={{ color: '#4ade80', fontWeight: 600, marginBottom: 16 }}>{result.message}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: subText, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nearest Shelters</div>
            {result.nearest_shelters.map((sh, i) => (
              <div key={i} style={{ background: dark ? 'rgba(6,11,24,0.5)' : 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: mainText }}>{sh.name}</div>
                <div style={{ fontSize: 12, color: subText, marginTop: 2 }}>{sh.distance} · {sh.address}</div>
              </div>
            ))}
            <div style={{ fontSize: 13, fontWeight: 600, color: subText, margin: '14px 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Emergency Numbers</div>
            {Object.entries(result.emergency_numbers).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: divider, fontSize: 13 }}>
                <span style={{ color: subText, textTransform: 'capitalize' }}>{k.replace('_', ' ')}</span>
                <span style={{ fontWeight: 600, color: '#f87171' }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: mainText }}>SOS History</div>
        {events.length === 0 && <div style={{ color: subText, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No SOS events.</div>}
        {events.map((ev) => (
          <div key={ev.sos_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: divider }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: mainText }}>{ev.latitude}, {ev.longitude}</div>
              <div style={{ fontSize: 12, color: subText, marginTop: 2 }}>{new Date(ev.created_at).toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: ev.status === 'RESOLVED' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: ev.status === 'RESOLVED' ? '#4ade80' : '#f87171' }}>{ev.status}</span>
              {ev.status !== 'RESOLVED' && <button onClick={() => resolveSOS(ev.sos_id).then(load)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: 'rgba(34,197,94,0.12)', color: '#4ade80', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Resolve</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

