import NextAuth from 'next-auth'
import { NextApiRequest, NextApiResponse } from 'next'
import { authOptions } from '@/lib/auth/auth-options'
import { loadEnvVars, ensureEnvVars } from '@/lib/db/env-debug'

// Ensure environment variables are loaded before configuring NextAuth
loadEnvVars();
ensureEnvVars();

console.log('[NEXTAUTH] Configuration:', {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NODE_ENV: process.env.NODE_ENV,
  HAS_SECRET: !!process.env.NEXTAUTH_SECRET,
  HAS_MONGODB_URI: !!process.env.MONGODB_URI,
  MONGODB_URI_PREFIX: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 15) + '...' : undefined
})

const handler = NextAuth(authOptions)

const wrappedHandler = async (req: Request, res: Response) => {
  try {
    console.log('[NEXTAUTH] Handling request:', {
      method: req.method,
      url: req.url,
    })
    
    // Log headers for debugging (omitting sensitive data)
    const headers = Array.from(req.headers.entries())
      .filter(([key]) => !key.includes('cookie') && !key.includes('auth'))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    console.log('[NEXTAUTH] Request headers:', headers);
    
    return await handler(req, res)
  } catch (error) {
    console.error('[NEXTAUTH] Error in auth handler:', error)
    throw error
  }
}

export { wrappedHandler as GET, wrappedHandler as POST }