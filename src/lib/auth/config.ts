export const AUTH_CONFIG = {
  SESSION_MAX_AGE: 30 * 24 * 60 * 60, // 30 days
  ROUTES: {
    signIn: '/login',
    signUp: '/signup',
    error: '/error',
  },
  MIN_PASSWORD_LENGTH: 8,
} as const;