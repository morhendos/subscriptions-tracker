import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT } from 'next-auth/jwt'

export interface UserRole {
  id: string
  name: string
}

// Make sure required fields are marked as required
export interface CustomUser extends Omit<DefaultUser, 'email' | 'name'> {
  id: string
  email: string
  name: string
  roles?: UserRole[]
}

declare module 'next-auth' {
  interface User extends CustomUser {}
  
  interface Session extends Omit<DefaultSession, 'user'> {
    user: {
      id: string
      email: string
      name: string
      roles?: UserRole[]
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    name: string
    roles?: UserRole[]
  }
}