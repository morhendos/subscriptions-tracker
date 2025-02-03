'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="
        p-2
        rounded-lg
        bg-paper paper-texture journal-shadow 
        border border-accent/20
        hover:scale-102 active:scale-98 
        transition-all duration-200
        flex items-center justify-center
        text-ink/90
      "
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun size={20} className="text-accent" strokeWidth={1.5} />
      ) : (
        <Moon size={20} className="text-accent" strokeWidth={1.5} />
      )}
    </button>
  );
}