import NextAuth from "next-auth"
import { authOptions } from "./lib/auth/auth-options"

export const { auth, signIn, signOut } = NextAuth(authOptions)