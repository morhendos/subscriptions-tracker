import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { AUTH_CONFIG } from './config'
import { AuthError, validateEmail, validatePassword } from './validation'
import { authenticateUser } from './auth-service'
import { CustomUser } from '@/types/auth'

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set in environment variables')
}

if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV === 'production') {
  throw new Error('NEXTAUTH_URL must be set in production environment')
}

const isDevelopment = process.env.NODE_ENV === 'development'

console.log('[AUTH OPTIONS] Initializing with:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
})

export const authOptions: AuthOptions = {
  debug: isDevelopment,
  logger: {
    error(code, ...message) {
      console.error('[NextAuth][Error]', code, message)
    },
    warn(code, ...message) {
      console.warn('[NextAuth][Warn]', code, message)
    },
    debug(code, ...message) {
      console.log('[NextAuth][Debug]', code, message)
    },
  },
  
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        usersJson: { label: 'Users JSON', type: 'text' },
      },
      async authorize(credentials) {
        console.log('[AUTH OPTIONS] authorize called with:', {
          hasEmail: !!credentials?.email,
          hasPassword: !!credentials?.password,
          hasUsersJson: !!credentials?.usersJson,
        })

        if (!credentials?.email || !credentials?.password) {
          console.error('[AUTH OPTIONS] Missing credentials')
          throw new AuthError('Email and password are required', 'invalid_credentials')
        }

        if (!validateEmail(credentials.email)) {
          console.error('[AUTH OPTIONS] Invalid email format')
          throw new AuthError('Invalid email format', 'invalid_credentials')
        }

        if (!validatePassword(credentials.password)) {
          console.error('[AUTH OPTIONS] Password too short')
          throw new AuthError('Password must be at least 8 characters', 'invalid_credentials')
        }

        try {
          const user = await authenticateUser(
            credentials.email,
            credentials.password,
            credentials.usersJson
          )
          console.log('[AUTH OPTIONS] User authenticated:', {
            id: user.id,
            email: user.email,
            hasRoles: !!user.roles,
          })
          return user
        } catch (error) {
          console.error('[AUTH OPTIONS] Authentication error:', error)
          if (error instanceof AuthError) {
            throw error
          }
          throw new AuthError('Authentication failed', 'invalid_credentials')
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      console.log('[AUTH OPTIONS] JWT callback:', { 
        hasUser: !!user,
        tokenId: token?.id,
      })

      if (user) {
        const customUser = user as CustomUser
        token.id = customUser.id
        token.email = customUser.email || ''
        token.name = customUser.name || ''
        token.roles = customUser.roles
      }
      return token
    },

    async session({ session, token }) {
      console.log('[AUTH OPTIONS] Session callback:', {
        hasUser: !!session?.user,
        tokenId: token?.id,
      })

      if (session.user) {
        session.user.id = token.id
        session.user.email = token.email || ''
        session.user.name = token.name || ''
        session.user.roles = token.roles
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
      name: isDevelopment ? 'next-auth.session-token' : `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: !isDevelopment
      }
    },
    callbackUrl: {
      name: isDevelopment ? 'next-auth.callback-url' : `__Secure-next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: !isDevelopment
      }
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: !isDevelopment
      }
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
}