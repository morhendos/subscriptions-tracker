import NextAuth from 'next-auth'
import { NextApiRequest, NextApiResponse } from 'next'
import { authOptions } from '@/lib/auth/auth-options'

console.log('[NEXTAUTH] Configuration:', {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NODE_ENV: process.env.NODE_ENV,
  HAS_SECRET: !!process.env.NEXTAUTH_SECRET,
})

const handler = NextAuth(authOptions)

const wrappedHandler = async (req: Request, res: Response) => {
  try {
    console.log('[NEXTAUTH] Handling request:', {
      method: req.method,
      url: req.url,
    })
    return await handler(req, res)
  } catch (error) {
    console.error('[NEXTAUTH] Error in auth handler:', error)
    throw error
  }
}

export { wrappedHandler as GET, wrappedHandler as POST }