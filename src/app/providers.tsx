'use client'

import { SessionProvider } from 'next-auth/react'
import { type Session } from 'next-auth'
import { ThemeProvider } from 'next-themes'

export default function Providers({ 
  children,
  session
}: { 
  children: React.ReactNode
  session: Session | null
}) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system"
      enableSystem={true}
      disableTransitionOnChange
    >
      <SessionProvider session={session}>
        {children}
      </SessionProvider>
    </ThemeProvider>
  )
}