/**
 * Tests for the subscription service
 */

import { 
  getUserSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  toggleSubscriptionStatus,
  getUpcomingBills
} from '../subscription-service';
import { SubscriptionModel } from '@/models/subscription';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

// Mock modules
jest.mock('@/models/subscription');
jest.mock('@/lib/db/simplified-connection', () => ({
  withConnection: jest.fn((callback) => callback())
}));
jest.mock('@/lib/db/unified-error-handler', () => ({
  withErrorHandling: jest.fn((callback) => callback())
}));

// Test data
const testUserId = 'user-123';
const testSubscriptionId = new mongoose.Types.ObjectId().toString();

// Sample subscription data
const sampleSubscription = {
  _id: new mongoose.Types.ObjectId(testSubscriptionId),
  userId: testUserId,
  name: 'Netflix',
  price: 15.99,
  currency: 'USD',
  billingPeriod: 'monthly',
  startDate: new Date('2023-01-01'),
  nextBillingDate: new Date('2023-02-01'),
  description: 'Streaming service',
  disabled: false,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

describe('Subscription Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSubscriptions', () => {
    it('should return formatted subscriptions for a user', async () => {
      // Setup mock
      const findMock = jest.fn().mockReturnThis();
      const sortMock = jest.fn().mockReturnThis();
      const leanMock = jest.fn().mockReturnThis();
      const execMock = jest.fn().mockResolvedValue([sampleSubscription]);
      
      // @ts-ignore - Partial mock implementation
      SubscriptionModel.find = findMock;
      findMock.mockReturnValue({
        sort: sortMock,
        lean: leanMock,
        exec: execMock
      });
      
      // Act
      const result = await getUserSubscriptions(testUserId);
      
      // Assert
      expect(findMock).toHaveBeenCalledWith({ userId: testUserId });
      expect(sortMock).toHaveBeenCalledWith({ nextBillingDate: 1 });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(testSubscriptionId);
      expect(result[0].name).toBe('Netflix');
      expect(result[0].startDate).toBe(sampleSubscription.startDate.toISOString());
    });
  });

  describe('getSubscriptionById', () => {
    it('should return a formatted subscription when found', async () => {
      // Setup mock
      const findOneMock = jest.fn().mockReturnThis();
      const leanMock = jest.fn().mockReturnThis();
      const execMock = jest.fn().mockResolvedValue(sampleSubscription);
      
      // @ts-ignore - Partial mock implementation
      SubscriptionModel.findOne = findOneMock;
      findOneMock.mockReturnValue({
        lean: leanMock,
        exec: execMock
      });
      
      // Act
      const result = await getSubscriptionById(testUserId, testSubscriptionId);
      
      // Assert
      expect(findOneMock).toHaveBeenCalledWith({
        _id: expect.any(mongoose.Types.ObjectId),
        userId: testUserId
      });
      expect(result).not.toBeNull();
      expect(result?.id).toBe(testSubscriptionId);
    });
    
    it('should return null when subscription not found', async () => {
      // Setup mock
      const findOneMock = jest.fn().mockReturnThis();
      const leanMock = jest.fn().mockReturnThis();
      const execMock = jest.fn().mockResolvedValue(null);
      
      // @ts-ignore - Partial mock implementation
      SubscriptionModel.findOne = findOneMock;
      findOneMock.mockReturnValue({
        lean: leanMock,
        exec: execMock
      });
      
      // Act
      const result = await getSubscriptionById(testUserId, testSubscriptionId);
      
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('createSubscription', () => {
    it('should create and return a formatted subscription', async () => {
      // Setup mock
      const createMock = jest.fn().mockResolvedValue(sampleSubscription);
      
      // @ts-ignore - Partial mock implementation
      SubscriptionModel.create = createMock;
      
      // Test data
      const subscriptionData = {
        name: 'Netflix',
        price: 15.99,
        currency: 'USD',
        billingPeriod: 'monthly',
        startDate: '2023-01-01',
        description: 'Streaming service'
      };
      
      // Act
      const result = await createSubscription(testUserId, subscriptionData);
      
      // Assert
      expect(createMock).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result.name).toBe(subscriptionData.name);
      expect(result.id).toBe(testSubscriptionId);
    });
  });

  describe('updateSubscription', () => {
    it('should update and return a formatted subscription when found', async () => {
      // Setup mocks
      const findOneMock = jest.fn().mockResolvedValue({
        ...sampleSubscription,
        toObject: () => sampleSubscription
      });
      
      const findByIdAndUpdateMock = jest.fn().mockReturnThis();
      const leanMock = jest.fn().mockReturnThis();
      const execMock = jest.fn().mockResolvedValue({
        ...sampleSubscription,
        name: 'Updated Netflix',
        price: 19.99
      });
      
      // @ts-ignore - Partial mock implementation
      SubscriptionModel.findOne = findOneMock;
      // @ts-ignore - Partial mock implementation
      SubscriptionModel.findByIdAndUpdate = findByIdAndUpdateMock;
      findByIdAndUpdateMock.mockReturnValue({
        lean: leanMock,
        exec: execMock
      });
      
      // Test data
      const updateData = {
        name: 'Updated Netflix',
        price: 19.99
      };
      
      // Act
      const result = await updateSubscription(testUserId, testSubscriptionId, updateData);
      
      // Assert
      expect(findOneMock).toHaveBeenCalled();
      expect(findByIdAndUpdateMock).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Netflix');
      expect(result?.price).toBe(19.99);
    });
    
    it('should return null when subscription not found', async () => {
      // Setup mock
      const findOneMock = jest.fn().mockResolvedValue(null);
      
      // @ts-ignore - Partial mock implementation
      SubscriptionModel.findOne = findOneMock;
      
      // Act
      const result = await updateSubscription(testUserId, testSubscriptionId, { name: 'Updated' });
      
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('deleteSubscription', () => {
    it('should return true when subscription deleted successfully', async () => {
      // Setup mock
      const deleteOneMock = jest.fn().mockResolvedValue({ deletedCount: 1 });
      
      // @ts-ignore - Partial mock implementation
      SubscriptionModel.deleteOne = deleteOneMock;
      
      // Act
      const result = await deleteSubscription(testUserId, testSubscriptionId);
      
      // Assert
      expect(deleteOneMock).toHaveBeenCalledWith({
        _id: expect.any(mongoose.Types.ObjectId),
        userId: testUserId
      });
      expect(result).toBe(true);
    });
    
    it('should return false when no subscription deleted', async () => {
      // Setup mock
      const deleteOneMock = jest.fn().mockResolvedValue({ deletedCount: 0 });
      
      // @ts-ignore - Partial mock implementation
      SubscriptionModel.deleteOne = deleteOneMock;
      
      // Act
      const result = await deleteSubscription(testUserId, 'non-existent-id');
      
      // Assert
      expect(result).toBe(false);
    });
  });

  // Additional test examples can be added for other functions
});
