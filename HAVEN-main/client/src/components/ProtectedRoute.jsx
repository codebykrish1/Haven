import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { worker } = useAuth();
  return worker ? children : <Navigate to="/login" replace />;
}
