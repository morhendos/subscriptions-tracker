import NextAuth from 'next-auth'
import { NextApiRequest, NextApiResponse } from 'next'
import { authOptions } from '@/lib/auth/auth-options'
import { loadEnvVars, ensureEnvVars } from '@/lib/db/env-debug'

// Ensure environment variables are loaded before configuring NextAuth
loadEnvVars();
ensureEnvVars();

const handler = NextAuth(authOptions)

const wrappedHandler = async (req: Request, res: Response) => {
  try {
    return await handler(req, res)
  } catch (error) {
    console.error('[NEXTAUTH] Error in auth handler:', error)
    throw error
  }
}

export { wrappedHandler as GET, wrappedHandler as POST }