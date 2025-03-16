'use client';

import { useEffect, useState } from 'react';
import { getWaitlistEntries, updateWaitlistEntry, deleteWaitlistEntry } from '../actions';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

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

export default function WaitlistPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: 'active',
    notes: '',
    tags: '',
  });
  
  // Get current query parameters
  const currentPage = Number(searchParams.get('page') || '1');
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search') || '';
  
  // Fetch entries
  useEffect(() => {
    async function fetchEntries() {
      setLoading(true);
      
      try {
        const result = await getWaitlistEntries({
          page: currentPage,
          status: status || undefined,
          search: search || undefined,
        });
        
        if (result.success && result.data) {
          setEntries(result.data.entries);
          setPagination(result.data.pagination);
          setError(null);
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
    }
    
    fetchEntries();
  }, [currentPage, status, search]);
  
  // Update URL with search parameters
  const updateSearchParams = (params: Record<string, string>) => {
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
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const searchValue = formData.get('search') as string;
    
    updateSearchParams({
      search: searchValue,
      page: '1', // Reset to first page on new search
    });
  };
  
  // Handle status filter
  const handleStatusFilter = (status: string) => {
    updateSearchParams({
      status,
      page: '1', // Reset to first page on filter change
    });
  };
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    updateSearchParams({ page: page.toString() });
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
        setEntries(entries.map(entry => 
          entry._id === selectedEntry._id ? { ...entry, ...updateData } : entry
        ));
        setIsEditModalOpen(false);
      } else {
        setError(result.error || 'Failed to update waitlist entry');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
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
    
    try {
      const result = await deleteWaitlistEntry(selectedEntry._id);
      
      if (result.success) {
        setEntries(entries.filter(entry => entry._id !== selectedEntry._id));
        setIsDeleteModalOpen(false);
      } else {
        setError(result.error || 'Failed to delete waitlist entry');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    }
  };
  
  // Status badge color mapping
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    contacted: 'bg-blue-100 text-blue-800',
    converted: 'bg-purple-100 text-purple-800',
    unsubscribed: 'bg-gray-100 text-gray-800',
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Waitlist Management</h1>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusFilter('')}
            className={`px-3 py-1 text-sm rounded-md ${!status ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
          >
            All
          </button>
          <button
            onClick={() => handleStatusFilter('active')}
            className={`px-3 py-1 text-sm rounded-md ${status === 'active' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
          >
            Active
          </button>
          <button
            onClick={() => handleStatusFilter('contacted')}
            className={`px-3 py-1 text-sm rounded-md ${status === 'contacted' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
          >
            Contacted
          </button>
          <button
            onClick={() => handleStatusFilter('converted')}
            className={`px-3 py-1 text-sm rounded-md ${status === 'converted' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
          >
            Converted
          </button>
          <button
            onClick={() => handleStatusFilter('unsubscribed')}
            className={`px-3 py-1 text-sm rounded-md ${status === 'unsubscribed' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
          >
            Unsubscribed
          </button>
        </div>
        
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search email, name, or notes..."
            className="flex-1 min-w-0 rounded-l-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="submit"
            className="rounded-r-md border border-primary bg-primary px-3 py-1 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Search
          </button>
        </form>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-destructive">
          {error}
        </div>
      )}
      
      {/* Waitlist Table */}
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 transition-colors hover:bg-muted/80">
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Signed Up</th>
                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    No waitlist entries found.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry._id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4">{entry.name}</td>
                    <td className="p-4">{entry.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[entry.status] || 'bg-gray-100 text-gray-800'}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="p-4">{new Date(entry.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(entry)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-3 py-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(entry)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 px-3 py-1"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing entries {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground shadow hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 w-8"
            >
              «
            </button>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground shadow hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 w-8"
            >
              ‹
            </button>
            
            {/* Page numbers - show up to 5 page links */}
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
                  className={`inline-flex items-center justify-center rounded-md text-sm font-medium shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 w-8 ${
                    pagination.page === pageNumber
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground shadow hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 w-8"
            >
              ›
            </button>
            <button
              onClick={() => handlePageChange(pagination.pages)}
              disabled={pagination.page === pagination.pages}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground shadow hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 w-8"
            >
              »
            </button>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {isEditModalOpen && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4">Edit Waitlist Entry</h3>
            
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
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="active">Active</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                  <option value="unsubscribed">Unsubscribed</option>
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
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground shadow hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2"
                >
                  Save Changes
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
            <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
            <p className="mb-6">
              Are you sure you want to delete the waitlist entry for <strong>{selectedEntry.email}</strong>? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground shadow hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
