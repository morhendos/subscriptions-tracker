import { IStorageProvider, StorageError } from './types';

// Set a longer fetch timeout for subscription requests
const FETCH_TIMEOUT = 60000; // 60 seconds

/**
 * Utility function to perform fetch with timeout
 */
async function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs: number = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const { signal } = controller;
  
  // Set up timeout
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  try {
    // Merge signal with existing options
    const fetchOptions = {
      ...options,
      signal,
    };
    
    const response = await fetch(url, fetchOptions);
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Process API response and handle errors consistently
 */
async function processApiResponse(response: Response): Promise<any> {
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    
    try {
      // Try to parse error from response
      const error = await response.json();
      errorMessage = error.error || errorMessage;
    } catch (parseError) {
      // If we can't parse JSON, use text content if available
      try {
        const textContent = await response.text();
        if (textContent) {
          errorMessage = `${errorMessage}: ${textContent.substring(0, 100)}`;
        }
      } catch {
        // If everything fails, use the status text
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }
    }
    
    throw new Error(errorMessage);
  }
  
  // Parse successful response
  return await response.json();
}

export class MongoDBStorageProvider implements IStorageProvider {
  async get<T>(key: string): Promise<T | null> {
    try {
      // Use fetchWithTimeout to prevent hanging requests
      const response = await fetchWithTimeout(`/api/storage?key=${encodeURIComponent(key)}`);
      return await processApiResponse(response);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      
      // Determine error type and create appropriate error message
      let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Handle timeout/abort errors explicitly
      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = 'Request timed out. Database is taking too long to respond.';
      }
      
      // Format and throw storage error
      throw new StorageError(
        `Failed to read from MongoDB: ${errorMessage}`,
        'read_error'
      );
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const response = await fetchWithTimeout('/api/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value })
      });

      const result = await processApiResponse(response);
      
      if (!result.success) {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      console.error("Error saving subscriptions:", error);
      
      let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Handle timeout/abort errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = 'Request timed out. Database is taking too long to respond.';
      }
      
      throw new StorageError(
        `Failed to write to MongoDB: ${errorMessage}`,
        'write_error'
      );
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const response = await fetchWithTimeout(`/api/storage?key=${encodeURIComponent(key)}`, {
        method: 'DELETE'
      });

      const result = await processApiResponse(response);
      
      if (!result.success) {
        throw new Error('Failed to delete data');
      }
    } catch (error) {
      console.error("Error deleting subscriptions:", error);
      
      let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = 'Request timed out. Database is taking too long to respond.';
      }
      
      throw new StorageError(
        `Failed to remove data from MongoDB: ${errorMessage}`,
        'delete_error'
      );
    }
  }

  async clear(): Promise<void> {
    try {
      const response = await fetchWithTimeout('/api/storage?key=all', {
        method: 'DELETE'
      });

      const result = await processApiResponse(response);
      
      if (!result.success) {
        throw new Error('Failed to clear data');
      }
    } catch (error) {
      console.error("Error clearing subscriptions:", error);
      
      let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = 'Request timed out. Database is taking too long to respond.';
      }
      
      throw new StorageError(
        `Failed to clear MongoDB data: ${errorMessage}`,
        'clear_error'
      );
    }
  }
}