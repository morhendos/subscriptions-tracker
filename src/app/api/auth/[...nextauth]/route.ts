/**
 * NextAuth API Route
 * 
 * This route handles all NextAuth.js authentication functionality
 * and provides improved error handling for production environments.
 */

import { authOptions } from '@/lib/auth';
import NextAuth from 'next-auth';

// Add monitoring and error handling wrapper
const nextAuthHandler = NextAuth(authOptions);

// Create a wrapped handler to catch errors
async function wrappedHandler(req: Request, context: any) {
  try {
    console.log(`[NEXTAUTH] Request to ${req.url}`);
    
    const response = await nextAuthHandler(req, context);
    
    if (response.status >= 400) {
      console.error(`[NEXTAUTH] Error response: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('[NEXTAUTH] Unhandled error:', error);
    
    // Return a generic error response
    return new Response(
      JSON.stringify({ error: 'Internal authentication error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

export { wrappedHandler as GET, wrappedHandler as POST };
