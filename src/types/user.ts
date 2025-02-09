import { Role } from './auth';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserInput {
  email: string;
  password: string;
  name?: string;
}