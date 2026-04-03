import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => localStorage.getItem('haven_theme') !== 'light');

  useEffect(() => {
    localStorage.setItem('haven_theme', dark ? 'dark' : 'light');
    document.body.style.background = dark ? '#000000' : '#fff1f2';
    document.body.style.color = dark ? '#e2e8f0' : '#1a0a0a';
  }, [dark]);

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
