'use client';

import { useEffect, useState, useCallback, useTransition, useRef } from 'react';
import { getWaitlistEntries, updateWaitlistEntry, deleteWaitlistEntry } from '../actions';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown, 
  Trash2, 
  Pencil, 
  X, 
  Check, 
  Clock, 
  Info, 
  Tag, 
  UserPlus, 
  AlertTriangle, 
  CalendarDays, 
  LoaderCircle, 
  Eye, 
  Mail,
  ArrowDownAZ
} from 'lucide-react';

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
        setEntries(result.data.entries);
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
  
  // Format date safely
  const formatDate = (dateString: string | Date) => {
    try {
      // If it's already a Date object, use it directly
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return 'Invalid date';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Date format error';
    }
  };
  
  // Open view modal
  const openViewModal = (entry: WaitlistEntry) => {
    setSelectedEntry(entry);
    setIsViewModalOpen(true);
  };
  
  // Open edit modal
  const openEditModal = (entry: WaitlistEntry) => {
    setSelectedEntry(entry);
    setFormData({
      name: entry.name,
      email: entry.email,
      status: entry.status,
      notes: entry.notes || '',
      tags: entry.tags.join(', '),
    });
    setIsEditModalOpen(true);
  };
  
  // Handle edit form change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEntry) return;
    
    setLoading(true);
    
    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);
    
    const updateData = {
      name: formData.name,
      email: formData.email,
      status: formData.status,
      notes: formData.notes,
      tags: tagsArray,
    };
    
    try {
      const result = await updateWaitlistEntry(selectedEntry._id, updateData);
      
      if (result.success) {
        // Update the entry in the local state
        setEntries(entries.map(entry => 
          entry._id === selectedEntry._id ? { ...entry, ...updateData } : entry
        ));
        setIsEditModalOpen(false);
        setError(null);
      } else {
        setError(result.error || 'Failed to update waitlist entry');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Open delete modal
  const openDeleteModal = (entry: WaitlistEntry) => {
    setSelectedEntry(entry);
    setIsDeleteModalOpen(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedEntry) return;
    
    setLoading(true);
    
    try {
      const result = await deleteWaitlistEntry(selectedEntry._id);
      
      if (result.success) {
        // Remove the entry from the local state
        setEntries(entries.filter(entry => entry._id !== selectedEntry._id));
        setIsDeleteModalOpen(false);
        setError(null);
        
        // Refetch if this was the last item on the page
        if (entries.length === 1 && currentPage > 1) {
          updateSearchParams({ page: (currentPage - 1).toString() });
        }
      } else {
        setError(result.error || 'Failed to delete waitlist entry');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Quick update status function
  const handleQuickStatusUpdate = async (entryId: string, newStatus: string) => {
    setLoading(true);
    
    try {
      const result = await updateWaitlistEntry(entryId, { status: newStatus });
      
      if (result.success) {
        // Update the entry in the local state
        setEntries(entries.map(entry => 
          entry._id === entryId ? { ...entry, status: newStatus } : entry
        ));
        setError(null);
      } else {
        setError(result.error || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Determine if a sort column is active
  const isSortActive = (column: string) => sortBy === column;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Waitlist Management</h1>
          <p className="text-muted-foreground mt-1">Manage and track your waitlist signups</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {pagination.total} entries
          </span>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchValue}
                onChange={handleSearchChange}
                placeholder="Search emails, names..."
                className="w-full rounded-md border border-input pl-9 pr-4 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center text-sm font-medium text-muted-foreground mr-2">
                <Filter className="mr-1 h-4 w-4" />
                Status:
              </div>
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusFilter(option.value)}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    status === option.value 
                      ? option.color 
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Error display */}
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-destructive text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
      </div>
      
      {/* Waitlist Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="relative w-full overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('name')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Name
                    {isSortActive('name') && (
                      <ArrowDownAZ className={`h-3 w-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('email')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Email
                    {isSortActive('email') && (
                      <ArrowDownAZ className={`h-3 w-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('status')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Status
                    {isSortActive('status') && (
                      <ArrowDownAZ className={`h-3 w-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <button 
                    onClick={() => handleSort('createdAt')}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Signed Up
                    {isSortActive('createdAt') && (
                      <ArrowDownAZ className={`h-3 w-3 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array(3).fill(0).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="p-4"><div className="h-4 bg-muted rounded w-24"></div></td>
                    <td className="p-4"><div className="h-4 bg-muted rounded w-32"></div></td>
                    <td className="p-4"><div className="h-5 bg-muted rounded w-20"></div></td>
                    <td className="p-4"><div className="h-4 bg-muted rounded w-28"></div></td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <div className="h-8 bg-muted rounded w-16"></div>
                        <div className="h-8 bg-muted rounded w-16"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <UserPlus className="h-8 w-8" />
                      <p>No waitlist entries found</p>
                      {(search || status) && (
                        <button
                          onClick={() => {
                            updateSearchParams({ search: '', status: '', page: '1' });
                            setSearchValue('');
                          }}
                          className="text-primary text-sm hover:underline mt-1"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry._id} className="group hover:bg-muted/50">
                    <td className="p-4 font-medium">{entry.name}</td>
                    <td className="p-4 text-sm">
                      <a href={`mailto:${entry.email}`} className="hover:underline flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {entry.email}
                      </a>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(entry.status || 'active')}`}>
                          {entry.status || 'active'}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="inline-flex gap-1">
                            {entry.status !== 'active' && (
                              <button 
                                onClick={() => handleQuickStatusUpdate(entry._id, 'active')}
                                className="text-blue-500 hover:text-blue-700" 
                                title="Mark as Active"
                              >
                                <Clock className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {entry.status !== 'contacted' && (
                              <button 
                                onClick={() => handleQuickStatusUpdate(entry._id, 'contacted')}
                                className="text-yellow-500 hover:text-yellow-700" 
                                title="Mark as Contacted"
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {entry.status !== 'converted' && (
                              <button 
                                onClick={() => handleQuickStatusUpdate(entry._id, 'converted')}
                                className="text-green-500 hover:text-green-700" 
                                title="Mark as Converted"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {entry.status !== 'unsubscribed' && (
                              <button 
                                onClick={() => handleQuickStatusUpdate(entry._id, 'unsubscribed')}
                                className="text-gray-500 hover:text-gray-700" 
                                title="Mark as Unsubscribed"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(entry.createdAt)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openViewModal(entry)}
                          className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(entry)}
                          className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(entry)}
                          className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Loading overlay */}
        {isPending && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {pagination.total > 0 ? `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} entries` : 'No entries'}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1 || loading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border shadow-sm h-8 w-8 bg-card text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
              <ChevronLeft className="h-4 w-4 -ml-3" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border shadow-sm h-8 w-8 bg-card text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              let pageNumber;
              if (pagination.pages <= 5) {
                // Show all pages if 5 or fewer
                pageNumber = i + 1;
              } else if (pagination.page <= 3) {
                // Show pages 1-5 if current page is near start
                pageNumber = i + 1;
              } else if (pagination.page >= pagination.pages - 2) {
                // Show last 5 pages if current page is near end
                pageNumber = pagination.pages - 4 + i;
              } else {
                // Show 2 pages before and after current page
                pageNumber = pagination.page - 2 + i;
              }
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={loading}
                  className={`inline-flex items-center justify-center rounded-md text-sm font-medium border shadow-sm h-8 w-8 disabled:opacity-50 disabled:pointer-events-none ${
                    pagination.page === pageNumber
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages || loading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border shadow-sm h-8 w-8 bg-card text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.pages)}
              disabled={pagination.page === pagination.pages || loading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border shadow-sm h-8 w-8 bg-card text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 -ml-3" />
            </button>
          </div>
        </div>
      )}
      
      {/* View Modal */}
      {isViewModalOpen && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Waitlist Entry Details</h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="inline-flex items-center justify-center rounded-full h-8 w-8 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium text-muted-foreground">Name</div>
                <div className="font-medium">{selectedEntry.name}</div>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium text-muted-foreground">Email</div>
                <div className="font-medium">
                  <a href={`mailto:${selectedEntry.email}`} className="text-primary hover:underline">
                    {selectedEntry.email}
                  </a>
                </div>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit ${getStatusColor(selectedEntry.status || 'active')}`}>
                  {selectedEntry.status || 'active'}
                </span>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium text-muted-foreground">Tags</div>
                <div>
                  {selectedEntry.tags && selectedEntry.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedEntry.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs"
                        >
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No tags</span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="text-sm font-medium text-muted-foreground">Notes</div>
                <div className="text-sm">
                  {selectedEntry.notes ? (
                    <p className="whitespace-pre-wrap">{selectedEntry.notes}</p>
                  ) : (
                    <span className="text-muted-foreground">No notes</span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-medium text-muted-foreground">Created At</div>
                  <div className="text-sm">
                    {formatDate(selectedEntry.createdAt)}
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                  <div className="text-sm">
                    {formatDate(selectedEntry.updatedAt)}
                  </div>
                </div>
              </div>
              
              {(selectedEntry.source || selectedEntry.referrer) && (
                <div className="pt-2 border-t">
                  <div className="text-sm font-medium mb-2">Source Information</div>
                  
                  {selectedEntry.source && (
                    <div className="flex flex-col gap-1 mb-2">
                      <div className="text-sm font-medium text-muted-foreground">Source</div>
                      <div className="text-sm">{selectedEntry.source}</div>
                    </div>
                  )}
                  
                  {selectedEntry.referrer && (
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-medium text-muted-foreground">Referrer</div>
                      <div className="text-sm break-all">{selectedEntry.referrer}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 pt-6">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal(selectedEntry);
                }}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Entry
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {isEditModalOpen && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Edit Waitlist Entry</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="inline-flex items-center justify-center rounded-full h-8 w-8 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium" htmlFor="tags">
                  Tags (comma separated)
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={formData.tags}
                  onChange={handleFormChange}
                  placeholder="tag1, tag2, tag3"
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium" htmlFor="notes">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleFormChange}
                  className="mt-1 w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium border bg-background text-foreground shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2"
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <div className="flex items-center text-destructive mb-4">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <h3 className="text-lg font-bold">Confirm Delete</h3>
            </div>
            
            <p className="mb-6">
              Are you sure you want to delete the waitlist entry for <strong>{selectedEntry.email}</strong>? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border bg-background text-foreground shadow-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2"
              >
                {loading ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
