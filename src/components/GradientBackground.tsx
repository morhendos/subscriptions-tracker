'use client';

import { useTheme } from '@/hooks/useTheme';
import { useEffect, useState } from 'react';

const gradientStyles = {
  dark: {
    main: {
      background:
        "linear-gradient(100deg, rgba(89, 35, 46, 0.7) 0%, rgba(10, 10, 27, 0.9) 45%, rgba(27, 35, 65, 0.7) 100%)",
    },
    centerGlow: {
      background:
        "radial-gradient(65% 75% at 50% 45%, rgba(82, 36, 46, 0.35) 0%, transparent 100%)",
    },
    subtleGlow1: {
      background:
        "radial-gradient(70% 35% at 50% 45%, rgba(82, 36, 46, 0.15) 0%, transparent 100%)",
    },
    subtleGlow2: {
      background:
        "radial-gradient(20% 50% at 50% 50%, rgba(82, 36, 46, 0.2) 0%, transparent 100%)",
    },
  },
  light: {
    main: {
      background:
        "linear-gradient(100deg, rgba(255, 236, 210, 0.7) 0%, rgba(255, 250, 245, 0.9) 45%, rgba(230, 240, 255, 0.7) 100%)",
    },
    centerGlow: {
      background:
        "radial-gradient(65% 75% at 50% 45%, rgba(255, 223, 187, 0.35) 0%, transparent 100%)",
    },
    subtleGlow1: {
      background:
        "radial-gradient(70% 35% at 50% 45%, rgba(255, 200, 150, 0.15) 0%, transparent 100%)",
    },
    subtleGlow2: {
      background:
        "radial-gradient(20% 50% at 50% 50%, rgba(230, 210, 255, 0.2) 0%, transparent 100%)",
    },
  },
};

export default function GradientBackground() {
  const { theme, mounted } = useTheme();
  const [currentTheme, setCurrentTheme] = useState(theme);

  // Update local state when theme changes
  useEffect(() => {
    if (mounted) {
      setCurrentTheme(theme);
    }
  }, [theme, mounted]);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }
  
  return (
    <>
      {/* Base layer */}
      <div 
        className="fixed inset-0 transition-colors duration-300 -z-50" 
        style={{ backgroundColor: currentTheme === 'dark' ? '#0A0A1B' : '#FFFAF5' }} 
      />

      {/* Main gradient effect */}
      <div 
        className="fixed inset-0 transition-opacity duration-300 -z-40" 
        style={gradientStyles[currentTheme].main} 
      />

      {/* Strong center glow */}
      <div 
        className="fixed inset-0 transition-opacity duration-300 -z-30" 
        style={gradientStyles[currentTheme].centerGlow} 
      />

      {/* Additional subtle glows */}
      <div 
        className="fixed inset-0 transition-opacity duration-300 -z-20" 
        style={gradientStyles[currentTheme].subtleGlow1} 
      />
      <div 
        className="fixed inset-0 transition-opacity duration-300 -z-10" 
        style={gradientStyles[currentTheme].subtleGlow2} 
      />
    </>
  );
}