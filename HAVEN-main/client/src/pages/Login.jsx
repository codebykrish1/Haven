import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await login(form);
      signIn(res.data.token, res.data.worker);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000000' }}>
      {/* Glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(226,55,68,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #E23744, #ff4d5a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 auto 16px' }}>H</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>Welcome back</div>
          <div style={{ fontSize: 14, color: '#475569', marginTop: 6 }}>Sign in to your HAVEN account</div>
        </div>

        <div style={{ background: 'rgba(8,8,8,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, backdropFilter: 'blur(12px)' }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#f87171' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {[{ name: 'email', label: 'Email address', type: 'email' }, { name: 'password', label: 'Password', type: 'password' }].map(({ name, label, type }) => (
              <div key={name} style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>{label}</label>
                <input
                  type={type} value={form[name]}
                  onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                  required
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(51,65,85,0.8)', background: 'rgba(6,11,24,0.6)', color: '#f1f5f9', fontSize: 14, outline: 'none', transition: 'border .15s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(226,55,68,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(51,65,85,0.8)'}
                />
              </div>
            ))}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 12, borderRadius: 10, border: 'none',
              background: loading ? '#334155' : 'linear-gradient(135deg, #E23744, #ff4d5a)',
              color: '#fff', fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4, transition: 'opacity .15s',
            }}>{loading ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#475569' }}>
            No account?{' '}
            <Link to="/register" style={{ color: '#ff4d5a', fontWeight: 500 }}>Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
