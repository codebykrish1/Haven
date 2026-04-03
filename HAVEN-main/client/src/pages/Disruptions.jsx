import React, { useEffect, useState } from 'react';
import { getAllDisruptions, createDisruption } from '../api';
import { useTheme } from '../context/ThemeContext';

const EVENT_TYPES = ['rain', 'flood', 'heatwave', 'storm', 'strike', 'road_closure'];
const SEVERITIES  = ['LOW', 'MEDIUM', 'HIGH'];
const SEV = { LOW: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' }, MEDIUM: { color: '#f97316', bg: 'rgba(249,115,22,0.1)' }, HIGH: { color: '#f87171', bg: 'rgba(239,68,68,0.1)' } };

export default function Disruptions() {
  const { dark } = useTheme();
  const [disruptions, setDisruptions] = useState([]);
  const [form, setForm] = useState({ event_type: 'rain', zone_id: '', city: '', severity: 'LOW', trigger_value: '' });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');

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

  const load = () => getAllDisruptions().then((r) => setDisruptions(r.data.disruptions));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setErr(''); setMsg('');
    try { const r = await createDisruption(form); setMsg(`Event logged — ${r.data.claims_triggered} claim(s) auto-triggered`); load(); }
    catch (e) { setErr(e.response?.data?.error || 'Error'); }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 40px' }}>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4, color: mainText }}>Disruption Events</div>
      <div style={{ fontSize: 14, color: subText, marginBottom: 28 }}>Log and monitor weather and civil disruptions.</div>

      <div style={{ ...card, marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: mainText }}>Log New Event</div>
        {err && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#f87171' }}>{err}</div>}
        {msg && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#4ade80' }}>{msg}</div>}
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            {[{ name: 'zone_id', label: 'Zone ID' }, { name: 'city', label: 'City' }, { name: 'trigger_value', label: 'Trigger Value', type: 'number' }].map(({ name, label, type }) => (
              <div key={name}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: subText, marginBottom: 6 }}>{label}</label>
                <input style={inputStyle} type={type || 'text'} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} required />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: subText, marginBottom: 6 }}>Event Type</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
                {EVENT_TYPES.map((t) => <option key={t} style={{ background: dark ? '#0f172a' : '#fff' }}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: subText, marginBottom: 6 }}>Severity</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                {SEVERITIES.map((s) => <option key={s} style={{ background: dark ? '#0f172a' : '#fff' }}>{s}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#E23744,#ff4d5a)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Log Event</button>
        </form>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {disruptions.length === 0 && <div style={{ ...card, textAlign: 'center', color: subText }}>No disruption events logged.</div>}
        {disruptions.map((d) => {
          const sv = SEV[d.severity] || SEV.LOW;
          return (
            <div key={d.event_id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, textTransform: 'capitalize', color: mainText }}>{d.event_type}</span>
                  <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sv.bg, color: sv.color }}>{d.severity}</span>
                </div>
                <div style={{ fontSize: 12, color: subText }}>{d.city} · Zone {d.zone_id} · {new Date(d.event_timestamp).toLocaleString()}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13 }}>
                <div style={{ color: subText }}>Trigger: <strong style={{ color: mainText }}>{d.trigger_value}</strong></div>
                <div style={{ color: subText, fontSize: 12 }}>Threshold: {d.threshold_value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

