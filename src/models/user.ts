import mongoose from 'mongoose';
import { Role } from '@/types/auth';

export interface UserDocument extends mongoose.Document {
  email: string;
  name: string;
  hashedPassword: string;
  roles: Role[];
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot be longer than 50 characters']
  },
  hashedPassword: {
    type: String,
    required: [true, 'Password is required']
  },
  roles: {
    type: [{
      id: String,
      name: String
    }],
    default: [{ id: '1', name: 'user' }],
    validate: {
      validator: function(roles: Role[]) {
        return roles.length > 0;
      },
      message: 'User must have at least one role'
    }
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: Date,
  lastLogin: Date
}, {
  timestamps: true
});

// Indexes for queries
userSchema.index({ email: 1 }, { unique: true }); // Primary email index
userSchema.index({ passwordResetToken: 1 }, { sparse: true }); // For password reset
userSchema.index({ emailVerificationToken: 1 }, { sparse: true }); // For email verification

// Hide sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.hashedPassword;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.failedLoginAttempts;
  delete user.lockedUntil;
  return user;
};

// Check if account is locked
userSchema.methods.isLocked = function(): boolean {
  if (!this.lockedUntil) return false;
  return new Date() < this.lockedUntil;
};

// Increment failed login attempts
userSchema.methods.incrementFailedLogins = function() {
  this.failedLoginAttempts += 1;
  
  // Lock account after 10 failed attempts
  if (this.failedLoginAttempts >= 10) {
    this.lockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
  
  return this.save();
};

// Reset failed login attempts
userSchema.methods.resetFailedLogins = function() {
  this.failedLoginAttempts = 0;
  this.lockedUntil = undefined;
  this.lastLogin = new Date();
  return this.save();
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

export const UserModel = mongoose.models.User || mongoose.model<UserDocument>('User', userSchema);