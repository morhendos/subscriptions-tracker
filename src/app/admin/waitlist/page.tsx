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
  
  // Fetch entries
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getWaitlistEntries({
        page: currentPage,
        status: status || undefined,
        search: search || undefined,
        sortBy,
        sortOrder: sortOrder as 'asc' | 'desc',
        limit: 10
      });
      
      if (result.success && result.data) {
        // Cast the entries to match our WaitlistEntry interface
        const typedEntries = result.data.entries as unknown as WaitlistEntry[];
        setEntries(typedEntries);
        setPagination(result.data.pagination);
      } else {
        setError(result.error || 'Failed to fetch waitlist entries');
        setEntries([]);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, status, search, sortBy, sortOrder]);
  
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);
  
  // Update URL with search parameters
  const updateSearchParams = useCallback((params: Record<string, string>) => {
    startTransition(() => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      
      // Update search parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          newSearchParams.set(key, value);
        } else {
          newSearchParams.delete(key);
        }
      });
      
      router.push(`${pathname}?${newSearchParams.toString()}`);
    });
  }, [searchParams, pathname, router]);
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };
  
  // Update search when debounced value changes
  useEffect(() => {
    if (debouncedSearchValue !== search) {
      updateSearchParams({
        search: debouncedSearchValue,
        page: '1', // Reset to first page on new search
      });
    }
  }, [debouncedSearchValue, search, updateSearchParams]);
  
  // Set initial search value from URL
  useEffect(() => {
    setSearchValue(search);
  }, [search]);
  
  // Handle status filter
  const handleStatusFilter = (statusValue: string) => {
    updateSearchParams({
      status: status === statusValue ? '' : statusValue, // Toggle status
      page: '1', // Reset to first page on filter change
    });
  };
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    updateSearchParams({ page: page.toString() });
  };
  
  // Handle sorting
  const handleSort = (column: string) => {
    const newSortOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc';
    updateSearchParams({ 
      sortBy: column, 
      sortOrder: newSortOrder 
    });
  };