import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const links = [
  { to: '/',            label: 'Dashboard'   },
  { to: '/policies',    label: 'Policies'    },
  { to: '/claims',      label: 'Claims'      },
  { to: '/disruptions', label: 'Disruptions' },
  { to: '/calendar',    label: 'Calendar'    },
  { to: '/badges',      label: 'Badges'      },
  { to: '/sos',         label: 'SOS'         },
];

export default function Navbar() {
  const { worker, signOut } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [avatarHover, setAvatarHover] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!worker) return null;

  const handleSignOut = () => { signOut(); navigate('/login'); };

  const bg        = dark ? 'rgba(0,0,0,0.97)'      : 'rgba(255,228,230,0.97)';
  const border    = dark ? 'rgba(255,255,255,0.08)' : 'rgba(226,55,68,0.25)';
  const activeCol = dark ? '#ff4d5a' : '#c0202e';
  const activeBg  = dark ? 'rgba(226,55,68,0.12)'  : 'rgba(226,55,68,0.15)';
  const linkColor = dark ? '#64748b' : '#9f1239';
  const textMain  = dark ? '#f1f5f9' : '#1a0a0a';
  const textSub   = dark ? '#64748b' : '#c0202e';

  return (
    <nav style={{
      background: bg,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${border}`,
      padding: '0 40px',
      display: 'flex',
      alignItems: 'center',
      height: 72,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: dark
        ? '0 1px 40px rgba(0,0,0,0.4)'
        : '0 1px 20px rgba(226,55,68,0.06)',
    }}>

      {/* ── Brand ── */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 48, textDecoration: 'none' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: 'linear-gradient(135deg, #E23744 0%, #ff4d5a 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 900, color: '#fff',
          boxShadow: '0 4px 14px rgba(226,55,68,0.4)',
        }}>H</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.4px', color: textMain, lineHeight: 1.1 }}>HAVEN</div>
          <div style={{ fontSize: 9, fontWeight: 600, color: '#E23744', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Gig Protection</div>
        </div>
      </Link>

      {/* ── Nav links ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        {links.map(({ to, label }) => {
          const active = pathname === to;
          const isSOS  = label === 'SOS';
          return (
            <Link key={to} to={to} style={{
              padding: '7px 16px',
              borderRadius: 9,
              fontSize: 13.5,
              fontWeight: active ? 600 : 400,
              color: isSOS ? (active ? '#f87171' : '#ef4444') : (active ? activeCol : linkColor),
              background: active ? (isSOS ? 'rgba(239,68,68,0.1)' : activeBg) : 'transparent',
              transition: 'all .15s',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.1px',
              textDecoration: 'none',
              position: 'relative',
            }}>
              {isSOS && <span style={{ marginRight: 4 }}>🆘</span>}
              {label}
              {active && !isSOS && (
                <div style={{
                  position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                  width: 20, height: 2, borderRadius: 2,
                  background: 'linear-gradient(90deg, #E23744, #ff4d5a)',
                }} />
              )}
            </Link>
          );
        })}
      </div>

      {/* ── Right side ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Theme toggle */}
        <button onClick={toggle} title={dark ? 'Switch to light mode' : 'Switch to dark mode'} style={{
          width: 40, height: 40, borderRadius: 10,
          border: `1px solid ${dark ? 'rgba(226,55,68,0.2)' : 'rgba(226,55,68,0.15)'}`,
          background: dark ? 'rgba(226,55,68,0.08)' : 'rgba(226,55,68,0.06)',
          color: dark ? '#ff4d5a' : '#E23744',
          cursor: 'pointer', fontSize: 17,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .2s',
        }}>
          {dark ? '☀️' : '🌙'}
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: dark ? 'rgba(51,65,85,0.6)' : 'rgba(203,213,225,0.8)' }} />

        {/* User info + avatar */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 10px', borderRadius: 10, transition: 'background .15s', background: avatarHover ? (dark ? 'rgba(226,55,68,0.08)' : 'rgba(226,55,68,0.05)') : 'transparent' }}
          onMouseEnter={() => setAvatarHover(true)}
          onMouseLeave={() => setAvatarHover(false)}
        >
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: textMain, lineHeight: 1.2 }}>{worker.full_name}</div>
            <div style={{ fontSize: 11, color: textSub, lineHeight: 1.2 }}>{worker.platform} · {worker.city}</div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #E23744, #ff4d5a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14, color: '#fff',
            boxShadow: '0 2px 8px rgba(226,55,68,0.35)',
            flexShrink: 0,
          }}>{worker.full_name?.[0]?.toUpperCase()}</div>
        </div>

        {/* Sign out */}
        <button onClick={handleSignOut} style={{
          padding: '7px 16px', borderRadius: 9,
          border: `1px solid ${dark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.2)'}`,
          background: dark ? 'rgba(239,68,68,0.07)' : 'rgba(239,68,68,0.05)',
          color: '#f87171', cursor: 'pointer', fontSize: 13, fontWeight: 500,
          transition: 'all .15s', whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,0.15)'; }}
        onMouseLeave={e => { e.target.style.background = dark ? 'rgba(239,68,68,0.07)' : 'rgba(239,68,68,0.05)'; }}
        >Sign out</button>
      </div>
    </nav>
  );
}
