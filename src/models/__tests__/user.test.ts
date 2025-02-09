import mongoose from 'mongoose';
import { UserModel } from '../user';

describe('User Model Test', () => {
  // Connect to test database before tests
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
  });

  // Clear database between tests
  afterEach(async () => {
    await UserModel.deleteMany({});
  });

  // Disconnect after all tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Validation', () => {
    it('should create a valid user', async () => {
      const validUser = new UserModel({
        email: 'test@example.com',
        name: 'Test User',
        hashedPassword: 'hashedpass123'
      });

      const savedUser = await validUser.save();
      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.roles).toEqual([{ id: '1', name: 'user' }]); // Default role
    });

    it('should fail on invalid email format', async () => {
      const userWithInvalidEmail = new UserModel({
        email: 'invalid-email',
        name: 'Test User',
        hashedPassword: 'hashedpass123'
      });

      await expect(userWithInvalidEmail.save()).rejects.toThrow();
    });

    it('should fail without required fields', async () => {
      const userWithoutRequired = new UserModel({});
      await expect(userWithoutRequired.save()).rejects.toThrow();
    });

    it('should enforce name length constraints', async () => {
      const userWithShortName = new UserModel({
        email: 'test@example.com',
        name: 'A', // Too short
        hashedPassword: 'hashedpass123'
      });

      await expect(userWithShortName.save()).rejects.toThrow();

      const userWithLongName = new UserModel({
        email: 'test@example.com',
        name: 'A'.repeat(51), // Too long
        hashedPassword: 'hashedpass123'
      });

      await expect(userWithLongName.save()).rejects.toThrow();
    });
  });

  describe('Unique Constraints', () => {
    it('should prevent duplicate emails', async () => {
      // Create first user
      await UserModel.create({
        email: 'test@example.com',
        name: 'Test User 1',
        hashedPassword: 'hashedpass123'
      });

      // Try to create second user with same email
      const duplicateUser = new UserModel({
        email: 'test@example.com',
        name: 'Test User 2',
        hashedPassword: 'hashedpass456'
      });

      await expect(duplicateUser.save()).rejects.toThrow();
    });
  });

  describe('Methods', () => {
    it('should handle failed login attempts correctly', async () => {
      const user = await UserModel.create({
        email: 'test@example.com',
        name: 'Test User',
        hashedPassword: 'hashedpass123'
      });

      // Increment failed attempts
      for (let i = 0; i < 9; i++) {
        await user.incrementFailedLogins();
        expect(user.isLocked()).toBe(false);
      }

      // Should lock on 10th attempt
      await user.incrementFailedLogins();
      expect(user.isLocked()).toBe(true);
      expect(user.failedLoginAttempts).toBe(10);
    });

    it('should reset failed login attempts', async () => {
      const user = await UserModel.create({
        email: 'test@example.com',
        name: 'Test User',
        hashedPassword: 'hashedpass123'
      });

      // Add some failed attempts
      await user.incrementFailedLogins();
      await user.incrementFailedLogins();
      
      // Reset them
      await user.resetFailedLogins();
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockedUntil).toBeUndefined();
      expect(user.lastLogin).toBeDefined();
    });

    it('should update last login timestamp', async () => {
      const user = await UserModel.create({
        email: 'test@example.com',
        name: 'Test User',
        hashedPassword: 'hashedpass123'
      });

      const beforeUpdate = user.lastLogin;
      await user.updateLastLogin();
      expect(user.lastLogin).not.toEqual(beforeUpdate);
    });
  });

  describe('Sanitization', () => {
    it('should remove sensitive data in toJSON', async () => {
      const user = await UserModel.create({
        email: 'test@example.com',
        name: 'Test User',
        hashedPassword: 'hashedpass123',
        emailVerificationToken: 'token123',
        passwordResetToken: 'reset123'
      });

      const jsonUser = user.toJSON();
      expect(jsonUser.hashedPassword).toBeUndefined();
      expect(jsonUser.emailVerificationToken).toBeUndefined();
      expect(jsonUser.passwordResetToken).toBeUndefined();
      expect(jsonUser.email).toBeDefined();
      expect(jsonUser.name).toBeDefined();
    });
  });
});