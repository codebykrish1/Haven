import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Policies from './pages/Policies';
import Claims from './pages/Claims';
import Disruptions from './pages/Disruptions';
import Calendar from './pages/Calendar';
import Badges from './pages/Badges';
import SOS from './pages/SOS';

export default function App() {
  const { loading } = useAuth();
  const { dark } = useTheme();

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: dark ? '#000000' : '#fff1f2', color: dark ? '#e2e8f0' : '#1a0a0a', transition: 'background .2s, color .2s' }}>
      <Navbar />
      <main style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/policies" element={<ProtectedRoute><Policies /></ProtectedRoute>} />
          <Route path="/claims" element={<ProtectedRoute><Claims /></ProtectedRoute>} />
          <Route path="/disruptions" element={<ProtectedRoute><Disruptions /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/badges" element={<ProtectedRoute><Badges /></ProtectedRoute>} />
          <Route path="/sos" element={<ProtectedRoute><SOS /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
