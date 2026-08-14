import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Light is the default theme; only an explicit user choice switches it.
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nigam-park-theme') as Theme | null;
      if (stored === 'dark' || stored === 'light') return stored;
    }
    return 'light';
  });


  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('nigam-park-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, setTheme, toggleTheme };
}
