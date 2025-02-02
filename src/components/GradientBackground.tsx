'use client';

import { useTheme } from "next-themes";

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

export default function GradientBackground() {
  const { theme } = useTheme();

  if (theme !== 'dark') return null;

  return (
    <>
      {/* Base dark layer */}
      <div className="fixed inset-0 bg-[#0A0A1B] -z-50" />

      {/* Main gradient effect */}
      <div className="fixed inset-0 -z-49" style={gradientStyles.main} />

      {/* Strong center glow */}
      <div className="fixed inset-0 -z-48" style={gradientStyles.centerGlow} />

      {/* Additional subtle glows */}
      <div className="fixed inset-0 -z-47" style={gradientStyles.subtleGlow1} />
      <div className="fixed inset-0 -z-46" style={gradientStyles.subtleGlow2} />
    </>
  );
}