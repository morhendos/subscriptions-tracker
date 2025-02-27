import { IStorageProvider, StorageError } from './types';

// Set a reasonable fetch timeout
const FETCH_TIMEOUT = 30000; // 30 seconds

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
    const fetchOptions = { ...options, signal };
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
      const error = await response.json();
      errorMessage = error.error || errorMessage;
    } catch {
      try {
        const textContent = await response.text();
        if (textContent) {
          errorMessage = `${errorMessage}: ${textContent.substring(0, 100)}`;
        }
      } catch {
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }
    }
    
    throw new Error(errorMessage);
  }
  
  return await response.json();
}

export class MongoDBStorageProvider implements IStorageProvider {
  async get<T>(key: string): Promise<T | null> {
    try {
      const response = await fetchWithTimeout(`/api/storage?key=${encodeURIComponent(key)}`);
      return await processApiResponse(response);
    } catch (error) {
      console.error("Error loading data:", error);
      
      let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = 'Request timed out. The server is taking too long to respond.';
      }
      
      throw new StorageError(
        `Failed to read data: ${errorMessage}`,
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
      console.error("Error saving data:", error);
      
      let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = 'Request timed out. The server is taking too long to respond.';
      }
      
      throw new StorageError(
        `Failed to write data: ${errorMessage}`,
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
      console.error("Error deleting data:", error);
      
      let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = 'Request timed out. The server is taking too long to respond.';
      }
      
      throw new StorageError(
        `Failed to delete data: ${errorMessage}`,
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
      console.error("Error clearing data:", error);
      
      let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        errorMessage = 'Request timed out. The server is taking too long to respond.';
      }
      
      throw new StorageError(
        `Failed to clear data: ${errorMessage}`,
        'clear_error'
      );
    }
  }
}