'use client';

// Original dark gradient styles - DO NOT TOUCH THESE
const gradientStyles = {
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
};

// Light theme styles
const lightGradientStyles = {
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
};

export default function GradientBackground() {
  return (
    <>
      {/* Light theme layers */}
      <div className="fixed inset-0 bg-[#FFFAF5] dark:hidden -z-50" />
      <div className="fixed inset-0 -z-40 dark:hidden" style={lightGradientStyles.main} />
      <div className="fixed inset-0 -z-30 dark:hidden" style={lightGradientStyles.centerGlow} />
      <div className="fixed inset-0 -z-20 dark:hidden" style={lightGradientStyles.subtleGlow1} />
      <div className="fixed inset-0 -z-10 dark:hidden" style={lightGradientStyles.subtleGlow2} />

      {/* Original dark theme layers - untouched */}
      <div className="fixed inset-0 bg-[#0A0A1B] hidden dark:block -z-50" />
      <div className="fixed inset-0 -z-40 hidden dark:block" style={gradientStyles.main} />
      <div className="fixed inset-0 -z-30 hidden dark:block" style={gradientStyles.centerGlow} />
      <div className="fixed inset-0 -z-20 hidden dark:block" style={gradientStyles.subtleGlow1} />
      <div className="fixed inset-0 -z-10 hidden dark:block" style={gradientStyles.subtleGlow2} />
    </>
  );
}