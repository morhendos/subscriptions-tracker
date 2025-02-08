import { useState, useEffect } from 'react';

export function useTheme() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.add('dark');
  }, []);

  return { theme: 'dark' as const, mounted };
}