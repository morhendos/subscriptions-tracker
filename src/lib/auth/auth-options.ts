import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { AUTH_CONFIG } from './config'
import { AuthError, validateEmail, validatePassword } from './validation'
import { authenticateUser } from '@/app/actions'
import { CustomUser } from '@/types/auth'
import { loadEnvVars, ensureEnvVars } from '@/lib/db/env-debug'

// Load environment variables to ensure they're available
loadEnvVars();
ensureEnvVars();

// Essential environment variables for NextAuth
if (!process.env.NEXTAUTH_SECRET) {
  console.error('[NEXTAUTH CONFIG] Missing NEXTAUTH_SECRET environment variable');
  throw new Error('NEXTAUTH_SECRET must be set in environment variables')
}

if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV === 'production') {
  console.error('[NEXTAUTH CONFIG] Missing NEXTAUTH_URL environment variable in production');
  throw new Error('NEXTAUTH_URL must be set in production environment')
}

console.log('[NEXTAUTH CONFIG] Environment variables loaded:', {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✓ set' : '✗ missing',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✓ set' : '✗ missing',
  MONGODB_URI: process.env.MONGODB_URI ? '✓ set' : '✗ missing',
  NODE_ENV: process.env.NODE_ENV
});

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        console.log('[NEXTAUTH AUTH] authorize() called with credentials');
        
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[NEXTAUTH AUTH] Missing credentials');
            throw new AuthError('Email and password are required', 'invalid_credentials')
          }

          if (!validateEmail(credentials.email)) {
            console.log('[NEXTAUTH AUTH] Invalid email format');
            throw new AuthError('Invalid email format', 'invalid_credentials')
          }

          if (!validatePassword(credentials.password)) {
            console.log('[NEXTAUTH AUTH] Invalid password format');
            throw new AuthError('Password must be at least 6 characters', 'invalid_credentials')
          }

          console.log('[NEXTAUTH AUTH] Calling authenticateUser with:', credentials.email);
          const result = await authenticateUser(
            credentials.email,
            credentials.password
          );

          if (!result.success || !result.data) {
            console.log('[NEXTAUTH AUTH] Authentication failed:', result.error);
            return null;
          }

          console.log('[NEXTAUTH AUTH] Authentication successful, returning user');
          // Ensure we return a proper User object
          return {
            id: result.data.id,
            email: result.data.email,
            name: result.data.name,
            roles: result.data.roles ?? [],
          };
        } catch (error) {
          console.error('[NEXTAUTH AUTH] Authentication error:', error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser
        token.id = customUser.id
        token.email = customUser.email
        token.name = customUser.name
        token.roles = customUser.roles || []
        console.log('[NEXTAUTH CALLBACK] jwt callback - user found, token created');
      } else {
        console.log('[NEXTAUTH CALLBACK] jwt callback - using existing token');
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.email = token.email
        session.user.name = token.name
        session.user.roles = token.roles || []
        console.log('[NEXTAUTH CALLBACK] session callback - user session enriched');
      } else {
        console.log('[NEXTAUTH CALLBACK] session callback - no user in session');
      }
      return session
    },
  },

  pages: AUTH_CONFIG.ROUTES,

  session: {
    strategy: 'jwt',
    maxAge: AUTH_CONFIG.SESSION_MAX_AGE,
  },

  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'development' ? 'next-auth.session-token' : '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV !== 'development'
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'development' ? 'next-auth.callback-url' : '__Secure-next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV !== 'development'
      }
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV !== 'development'
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}