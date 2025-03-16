import mongoose from 'mongoose';

export interface WaitlistDocument extends mongoose.Document {
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  source?: string;
  referrer?: string;
  status: string;
  notes?: string;
  tags: string[];
  metadata?: Record<string, any>;
}

const waitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
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
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String
  },
  source: {
    type: String,
    trim: true
  },
  referrer: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'contacted', 'converted', 'unsubscribed'],
    default: 'active'
  },
  notes: {
    type: String
  },
  tags: {
    type: [String],
    default: []
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
waitlistSchema.index({ email: 1 });
waitlistSchema.index({ status: 1 });
waitlistSchema.index({ createdAt: -1 });
waitlistSchema.index({ tags: 1 });

export const WaitlistModel = mongoose.models.Waitlist || mongoose.model<WaitlistDocument>('Waitlist', waitlistSchema);
