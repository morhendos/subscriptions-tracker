import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware to protect admin routes
 * 
 * This checks if the user is authenticated and has admin role
 * Redirects to login page if not authenticated
 * Redirects to dashboard if authenticated but not admin
 */
export async function adminAuthMiddleware(req: NextRequest) {
  // Get JWT token from request
  const token = await getToken({ req });
  
  console.log('[ADMIN MIDDLEWARE] Token received:', token ? 'yes' : 'no');
  
  // Not authenticated
  if (!token) {
    console.log('[ADMIN MIDDLEWARE] No token found, redirecting to login');
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  // Log token information for debugging
  console.log('[ADMIN MIDDLEWARE] User from token:', {
    id: token.id,
    email: token.email,
    roles: token.roles
  });
  
  // Check for admin role
  const hasAdminRole = token.roles && 
                      Array.isArray(token.roles) && 
                      token.roles.some((role: any) => role.name === 'admin');
  
  console.log('[ADMIN MIDDLEWARE] Has admin role:', hasAdminRole);
  
  // Authenticated but not admin
  if (!hasAdminRole) {
    console.log('[ADMIN MIDDLEWARE] Not an admin, redirecting to dashboard');
    // Redirect to dashboard with access denied message
    const url = new URL('/', req.url);
    url.searchParams.set('accessDenied', 'true');
    return NextResponse.redirect(url);
  }
  
  // Admin user - allow access
  console.log('[ADMIN MIDDLEWARE] Admin access granted');
  return NextResponse.next();
}
