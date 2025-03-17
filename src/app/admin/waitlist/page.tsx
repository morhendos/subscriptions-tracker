'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { getWaitlistEntries, updateWaitlistEntry, deleteWaitlistEntry } from '../actions';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Pencil, 
  X, 
  Check, 
  Clock, 
  Tag, 
  UserPlus, 
  AlertTriangle, 
  CalendarDays, 
  LoaderCircle, 
  Eye, 
  Mail,
  ArrowDownAZ
} from 'lucide-react';
import WaitlistDiagnostics from './diagnostics';
import WaitlistAuthFix from './fix-auth';

// Define types for waitlist entries
interface WaitlistEntry {
  _id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  ipAddress?: string;
  userAgent?: string;
  source?: string;
  referrer?: string;
  status: string;
  notes?: string;
  tags: string[];
  metadata?: any;
  [key: string]: any; // Allow any additional properties from the database
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Simple debounce function implementation
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function WaitlistPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: 'active',
    notes: '',
    tags: '',
  });
  
  // Use debounced search value
  const debouncedSearchValue = useDebounce(searchValue, 500);
  
  // Get current query parameters
  const currentPage = Number(searchParams.get('page') || '1');
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  
  // Define status options with colors
  const statusOptions = [
    { value: 'active', label: 'Active', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'converted', label: 'Converted', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'unsubscribed', label: 'Unsubscribed', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  ];
  
  // Find status color
  const getStatusColor = (status: string) => {
    return statusOptions.find(option => option.value === status)?.color || 'bg-gray-100 text-gray-800 border-gray-200';
  };