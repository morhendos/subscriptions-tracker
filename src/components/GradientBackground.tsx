'use client';

import { useTheme } from 'next-themes';

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
  // We don't need mounting state here as we'll use tailwind classes for the initial render
  const { theme } = useTheme();
  
  const currentTheme = theme === 'dark' ? 'dark' : 'light';
  const styles = gradientStyles[currentTheme];
  
  return (
    <>
      {/* Base layer with Tailwind classes for initial render */}
      <div className="fixed inset-0 bg-[#FFFAF5] dark:bg-[#0A0A1B] -z-50" />

      {/* Gradient layers with CSS-in-JS for theme-specific gradients */}
      <div className="fixed inset-0 -z-40" style={styles.main} />
      <div className="fixed inset-0 -z-30" style={styles.centerGlow} />
      <div className="fixed inset-0 -z-20" style={styles.subtleGlow1} />
      <div className="fixed inset-0 -z-10" style={styles.subtleGlow2} />
    </>
  );
}