import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { AUTH_CONFIG } from './config'
import { AuthError, validateEmail, validatePassword } from './validation'
import { authenticateUser } from '@/app/actions'
import { CustomUser } from '@/types/auth'

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set in environment variables')
}

if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV === 'production') {
  throw new Error('NEXTAUTH_URL must be set in production environment')
}

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
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new AuthError('Email and password are required', 'invalid_credentials')
          }

          if (!validateEmail(credentials.email)) {
            throw new AuthError('Invalid email format', 'invalid_credentials')
          }

          if (!validatePassword(credentials.password)) {
            throw new AuthError('Password must be at least 6 characters', 'invalid_credentials')
          }

          const result = await authenticateUser(
            credentials.email,
            credentials.password
          );

          if (!result.success || !result.data) {
            return null;
          }

          // Ensure we return a proper User object
          return {
            id: result.data.id,
            email: result.data.email,
            name: result.data.name,
            roles: result.data.roles ?? [],
          };
        } catch (error) {
          console.error('Authentication error:', error);
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
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.email = token.email
        session.user.name = token.name
        session.user.roles = token.roles || []
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

  secret: process.env.NEXTAUTH_SECRET,
}