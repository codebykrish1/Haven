import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('haven_token');
    if (token) {
      getMe()
        .then((res) => setWorker(res.data.worker))
        .catch(() => localStorage.removeItem('haven_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = (token, workerData) => {
    localStorage.setItem('haven_token', token);
    setWorker(workerData);
  };

  const signOut = () => {
    localStorage.removeItem('haven_token');
    setWorker(null);
  };

  return (
    <AuthContext.Provider value={{ worker, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
