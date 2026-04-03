import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api';
import { useAuth } from '../context/AuthContext';

const PLATFORMS = ['Swiggy', 'Zomato', 'Ola', 'Uber', 'Dunzo', 'Other'];

const fields = [
  { name: 'full_name', label: 'Full Name', type: 'text', required: true },
  { name: 'email', label: 'Email Address', type: 'email', required: true },
  { name: 'phone_number', label: 'Phone Number', type: 'tel', required: true },
  { name: 'password', label: 'Password', type: 'password', required: true },
  { name: 'city', label: 'City', type: 'text', required: true },
  { name: 'zone_id', label: 'Zone ID', type: 'text', required: true },
  { name: 'avg_daily_earning', label: 'Avg Daily Earning (₹)', type: 'number', required: false },
  { name: 'upi_id', label: 'UPI ID', type: 'text', required: false },
];

const inputStyle = {
  width: '100%', padding: '10px 13px', borderRadius: 10,
  border: '1px solid rgba(51,65,85,0.8)', background: 'rgba(6,11,24,0.6)',
  color: '#f1f5f9', fontSize: 13, outline: 'none',
};

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', phone_number: '', password: '', platform: 'Swiggy', city: '', zone_id: '', avg_daily_earning: '', upi_id: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await register(form);
      signIn(res.data.token, res.data.worker);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000', padding: '40px 24px' }}>
      <div style={{ position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(226,55,68,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #E23744, #ff4d5a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 auto 16px' }}>H</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>Create your account</div>
          <div style={{ fontSize: 14, color: '#475569', marginTop: 6 }}>Join HAVEN and protect your gig income</div>
        </div>

        <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.6)', borderRadius: 20, padding: 32, backdropFilter: 'blur(12px)' }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#f87171' }}>{error}</div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              {fields.map(({ name, label, type, required }) => (
                <div key={name} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                    {label} {!required && <span style={{ color: '#334155' }}>(optional)</span>}
                  </label>
                  <input
                    type={type} value={form[name]} required={required}
                    onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(226,55,68,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.8)'}
                  />
                </div>
              ))}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Platform</label>
                <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {PLATFORMS.map((p) => <option key={p} style={{ background: '#0f172a' }}>{p}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 12, borderRadius: 10, border: 'none',
              background: loading ? '#334155' : 'linear-gradient(135deg, #E23744, #ff4d5a)',
              color: '#fff', fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
            }}>{loading ? 'Creating account…' : 'Create account'}</button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#475569' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#ff4d5a', fontWeight: 500 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
