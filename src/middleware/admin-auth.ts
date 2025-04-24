import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isAdmin } from '@/utils/auth';

/**
 * Middleware to protect admin routes
 * 
 * This checks if the user is authenticated and has admin role
 * Redirects to login page if not authenticated
 * Redirects to dashboard if authenticated but not admin
 */
export async function adminAuthMiddleware(req: NextRequest) {
  const token = await getToken({ req });
  
  // Not authenticated
  if (!token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  // Authenticated but not admin
  if (!isAdmin(token)) {
    // Redirect to dashboard with access denied message
    const url = new URL('/', req.url);
    url.searchParams.set('accessDenied', 'true');
    return NextResponse.redirect(url);
  }
  
  // Admin user - allow access
  return NextResponse.next();
}
