import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import GradientBackground from "@/components/GradientBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Subscriptions Tracker",
  description: "Track all your subscriptions in one place",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="subscriptions-tracker-theme"
        >
          <div className="dark:relative">
            <div className="dark:block hidden">
              <GradientBackground />
            </div>
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}