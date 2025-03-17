'use server'

import { withAuthConnection } from '@/lib/db/auth-connection';
import { WaitlistModel, WaitlistDocument } from '@/models/waitlist';
import { getServerSession } from 'next-auth';
import { isAdmin } from '@/utils/auth';
import { revalidatePath } from 'next/cache';
import { loadEnvVars } from '@/lib/db/env-debug';
import mongoose from 'mongoose';

// Initialize environment variables
loadEnvVars();

// Interface for filter parameters for waitlist
interface WaitlistFilter {
  status?: string;
  search?: string;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Serialize a MongoDB document to a plain JavaScript object,
 * converting ObjectId and Date to strings to prevent "Objects with toJSON methods are not supported" warning
 */
function serializeDocument(doc: any): any {
  if (!doc) return null;
  
  // Handle ObjectId instance directly
  if (doc instanceof mongoose.Types.ObjectId) {
    return doc.toString();
  }
  
  // If it's already a plain object from lean(), we need to handle _id specially
  const result: Record<string, any> = {};
  
  // Copy all properties
  Object.keys(doc).forEach(key => {
    const value = doc[key];
    
    // Handle ObjectId (convert to string)
    if (key === '_id' && value) {
      if (typeof value === 'object' && value !== null && typeof value.toString === 'function') {
        result[key] = value.toString();
      } else {
        // For lean objects where _id might already be a string
        result[key] = value;
      }
    }
    // Handle Date objects (convert to ISO string)
    else if (value instanceof Date) {
      result[key] = value.toISOString();
    }
    // Handle arrays (recursively serialize each item)
    else if (Array.isArray(value)) {
      result[key] = value.map(item => {
        if (typeof item === 'object' && item !== null) {
          return serializeDocument(item);
        }
        return item;
      });
    }
    // Handle nested objects (recursively serialize)
    else if (typeof value === 'object' && value !== null) {
      result[key] = serializeDocument(value);
    }
    // Handle primitive values
    else {
      result[key] = value;
    }
  });
  
  return result;
}

/**
 * Get waitlist entries with optional filtering
 */
export async function getWaitlistEntries(filter: WaitlistFilter = {}) {
  try {
    console.log('[ADMIN ACTIONS] Getting waitlist entries with filter:', JSON.stringify(filter));
    
    // Check if user is authorized
    const session = await getServerSession();
    
    console.log('[ADMIN ACTIONS] Session data:', JSON.stringify({
      authenticated: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        roles: session.user.roles
      } : null
    }));
    
    if (!session) {
      console.log('[ADMIN ACTIONS] Unauthorized access attempt - No session');
      return { success: false, error: 'Authentication required' };
    }
    
    if (!session.user) {
      console.log('[ADMIN ACTIONS] Unauthorized access attempt - No user in session');
      return { success: false, error: 'User information missing' };
    }
    
    if (!session.user.roles || !Array.isArray(session.user.roles)) {
      console.log('[ADMIN ACTIONS] Unauthorized access attempt - No roles array', session.user);
      return { success: false, error: 'Roles information missing' };
    }
    
    const hasAdminRole = session.user.roles.some(role => role.name === 'admin');
    if (!hasAdminRole) {
      console.log('[ADMIN ACTIONS] Unauthorized access attempt - Not an admin');
      return { success: false, error: 'Admin privileges required' };
    }

    // Default parameters
    const {
      status,
      search,
      tags,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filter;
    
    // Build query filters
    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }
    
    console.log('[ADMIN ACTIONS] Constructed query:', JSON.stringify(query));
    
    // Use withAuthConnection to get a database connection
    const result = await withAuthConnection(async () => {
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Sort configuration
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      console.log('[ADMIN ACTIONS] Executing find query with sort:', JSON.stringify(sort));
      
      // Get total count for pagination first
      const totalEntries = await WaitlistModel.countDocuments(query).exec();
      console.log('[ADMIN ACTIONS] Total entries found:', totalEntries);
      
      // Execute query
      let waitlistEntries = [];
      try {
        waitlistEntries = await WaitlistModel.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(); // Add explicit exec() to ensure promise resolution
          
        console.log('[ADMIN ACTIONS] Retrieved entries:', waitlistEntries.length);
      } catch (err) {
        console.error('[ADMIN ACTIONS] Error in find query:', err);
        throw err;
      }
      
      // Serialize the entries to plain objects
      const serializedEntries = waitlistEntries.map(entry => serializeDocument(entry));
      
      return {
        entries: serializedEntries,
        pagination: {
          page,
          limit,
          total: totalEntries,
          pages: Math.ceil(totalEntries / limit)
        }
      };
    }, 'waitlist-entries');
    
    console.log('[ADMIN ACTIONS] Final result:', { 
      success: true, 
      entriesCount: result.entries.length,
      pagination: result.pagination 
    });
    
    return { 
      success: true, 
      data: result
    };
  } catch (error: any) {
    console.error('[ADMIN ACTIONS] Error fetching waitlist entries:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch waitlist entries' 
    };
  }
}

/**
 * Update a waitlist entry
 */
export async function updateWaitlistEntry(id: string, data: Partial<WaitlistDocument>) {
  try {
    console.log('[ADMIN ACTIONS] Updating waitlist entry:', id, 'with data:', JSON.stringify(data));
    
    // Check if user is authorized
    const session = await getServerSession();
    
    console.log('[ADMIN ACTIONS] Session data:', JSON.stringify({
      authenticated: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        roles: session.user.roles
      } : null
    }));
    
    if (!session || !session.user || !session.user.roles || !session.user.roles.some(role => role.name === 'admin')) {
      console.log('[ADMIN ACTIONS] Unauthorized update attempt');
      return { success: false, error: 'Admin privileges required' };
    }

    // Use withAuthConnection to get a database connection
    const updatedEntry = await withAuthConnection(async () => {
      // Find and update the entry
      const result = await WaitlistModel.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      ).lean().exec();
      
      return result;
    }, 'update-waitlist-entry');
    
    if (!updatedEntry) {
      console.log('[ADMIN ACTIONS] Waitlist entry not found for update:', id);
      return { success: false, error: 'Waitlist entry not found' };
    }
    
    // Revalidate the admin pages
    revalidatePath('/admin/waitlist');
    
    console.log('[ADMIN ACTIONS] Successfully updated waitlist entry:', id);
    return { success: true, data: serializeDocument(updatedEntry) };
  } catch (error: any) {
    console.error('[ADMIN ACTIONS] Error updating waitlist entry:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update waitlist entry' 
    };
  }
}

/**
 * Delete a waitlist entry
 */
export async function deleteWaitlistEntry(id: string) {
  try {
    console.log('[ADMIN ACTIONS] Deleting waitlist entry:', id);
    
    // Check if user is authorized
    const session = await getServerSession();
    
    console.log('[ADMIN ACTIONS] Session data:', JSON.stringify({
      authenticated: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        roles: session.user.roles
      } : null
    }));
    
    if (!session || !session.user || !session.user.roles || !session.user.roles.some(role => role.name === 'admin')) {
      console.log('[ADMIN ACTIONS] Unauthorized delete attempt');
      return { success: false, error: 'Admin privileges required' };
    }

    // Use withAuthConnection to get a database connection
    const deletedEntry = await withAuthConnection(async () => {
      // Find and delete the entry
      return await WaitlistModel.findByIdAndDelete(id).exec();
    }, 'delete-waitlist-entry');
    
    if (!deletedEntry) {
      console.log('[ADMIN ACTIONS] Waitlist entry not found for deletion:', id);
      return { success: false, error: 'Waitlist entry not found' };
    }
    
    // Revalidate the admin pages
    revalidatePath('/admin/waitlist');
    
    console.log('[ADMIN ACTIONS] Successfully deleted waitlist entry:', id);
    return { success: true };
  } catch (error: any) {
    console.error('[ADMIN ACTIONS] Error deleting waitlist entry:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to delete waitlist entry' 
    };
  }
}

/**
 * Get waitlist statistics
 */
export async function getWaitlistStats() {
  try {
    console.log('[ADMIN ACTIONS] Fetching waitlist statistics');
    
    // Check if user is authorized
    const session = await getServerSession();
    
    console.log('[ADMIN ACTIONS] Session data:', JSON.stringify({
      authenticated: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        roles: session.user.roles
      } : null
    }));
    
    if (!session || !session.user || !session.user.roles || !session.user.roles.some(role => role.name === 'admin')) {
      console.log('[ADMIN ACTIONS] Unauthorized stats access attempt');
      return { success: false, error: 'Admin privileges required' };
    }

    // Use withAuthConnection to get a database connection
    const stats = await withAuthConnection(async () => {
      // Get total entries first as a health check
      const totalEntries = await WaitlistModel.countDocuments().exec();
      console.log('[ADMIN ACTIONS] Total waitlist entries:', totalEntries);
      
      // If no entries, return simplified stats
      if (totalEntries === 0) {
        return {
          total: 0,
          byStatus: {},
          dailySignups: []
        };
      }
      
      // Get counts by status
      const statusCounts = await WaitlistModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      console.log('[ADMIN ACTIONS] Status counts:', statusCounts);
      
      // Get counts by date (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const dailyCounts = await WaitlistModel.aggregate([
        { 
          $match: { 
            createdAt: { $gte: sevenDaysAgo } 
          } 
        },
        {
          $group: {
            _id: { 
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } 
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      console.log('[ADMIN ACTIONS] Daily counts:', dailyCounts);
      
      // Format the results
      const statusStats = statusCounts.reduce((acc: any, curr: any) => {
        acc[curr._id || 'active'] = curr.count;
        return acc;
      }, {});
      
      return {
        total: totalEntries,
        byStatus: statusStats,
        dailySignups: dailyCounts.map((day: any) => ({
          date: day._id,
          count: day.count
        }))
      };
    }, 'waitlist-stats');
    
    console.log('[ADMIN ACTIONS] Waitlist stats:', stats);
    return { 
      success: true, 
      data: stats
    };
  } catch (error: any) {
    console.error('[ADMIN ACTIONS] Error fetching waitlist stats:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch waitlist statistics' 
    };
  }
}