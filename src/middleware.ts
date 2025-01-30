import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    console.log('Protected route accessed:', req.nextUrl.pathname)
  },
  {
    pages: {
      signIn: '/login',
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        
        // Always allow these paths
        if (
          path.startsWith('/assets/') ||
          path === '/login' ||
          path === '/signup' ||
          path === '/api/auth'
        ) {
          return true
        }

        // Require token for all other paths
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}