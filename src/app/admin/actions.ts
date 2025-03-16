'use server'

import { connectToDB } from '@/lib/db/connection';
import { WaitlistModel, WaitlistDocument } from '@/models/waitlist';
import { getServerSession } from 'next-auth';
import { isAdmin } from '@/utils/auth';
import { revalidatePath } from 'next/cache';

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
 * Get waitlist entries with optional filtering
 */
export async function getWaitlistEntries(filter: WaitlistFilter = {}) {
  try {
    // Check if user is authorized
    const session = await getServerSession();
    if (!session || !isAdmin(session.user)) {
      return { success: false, error: 'Unauthorized' };
    }

    // Connect to the database
    await connectToDB();
    
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
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Sort configuration
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query
    const waitlistEntries = await WaitlistModel.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const totalEntries = await WaitlistModel.countDocuments(query);
    
    return { 
      success: true, 
      data: {
        entries: waitlistEntries,
        pagination: {
          page,
          limit,
          total: totalEntries,
          pages: Math.ceil(totalEntries / limit)
        }
      }
    };
  } catch (error: any) {
    console.error('Error fetching waitlist entries:', error);
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
    // Check if user is authorized
    const session = await getServerSession();
    if (!session || !isAdmin(session.user)) {
      return { success: false, error: 'Unauthorized' };
    }

    // Connect to the database
    await connectToDB();
    
    // Find and update the entry
    const updatedEntry = await WaitlistModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    
    if (!updatedEntry) {
      return { success: false, error: 'Waitlist entry not found' };
    }
    
    // Revalidate the admin pages
    revalidatePath('/admin/waitlist');
    
    return { success: true, data: updatedEntry };
  } catch (error: any) {
    console.error('Error updating waitlist entry:', error);
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
    // Check if user is authorized
    const session = await getServerSession();
    if (!session || !isAdmin(session.user)) {
      return { success: false, error: 'Unauthorized' };
    }

    // Connect to the database
    await connectToDB();
    
    // Find and delete the entry
    const deletedEntry = await WaitlistModel.findByIdAndDelete(id);
    
    if (!deletedEntry) {
      return { success: false, error: 'Waitlist entry not found' };
    }
    
    // Revalidate the admin pages
    revalidatePath('/admin/waitlist');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting waitlist entry:', error);
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
    // Check if user is authorized
    const session = await getServerSession();
    if (!session || !isAdmin(session.user)) {
      return { success: false, error: 'Unauthorized' };
    }

    // Connect to the database
    await connectToDB();
    
    // Get counts by status
    const statusCounts = await WaitlistModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Get total entries
    const totalEntries = await WaitlistModel.countDocuments();
    
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
    
    // Format the results
    const statusStats = statusCounts.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
    
    return { 
      success: true, 
      data: {
        total: totalEntries,
        byStatus: statusStats,
        dailySignups: dailyCounts.map(day => ({
          date: day._id,
          count: day.count
        }))
      }
    };
  } catch (error: any) {
    console.error('Error fetching waitlist stats:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch waitlist statistics' 
    };
  }
}
