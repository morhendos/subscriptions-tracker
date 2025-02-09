import { IStorageProvider, StorageError } from './types';

export class MongoDBStorageProvider implements IStorageProvider {
  async get<T>(key: string): Promise<T | null> {
    try {
      const response = await fetch(`/api/storage?key=${encodeURIComponent(key)}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to read data');
      }
      return await response.json();
    } catch (error) {
      throw new StorageError(
        `Failed to read from MongoDB: ${error.message}`,
        'read_error'
      );
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const response = await fetch('/api/storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to write data');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      throw new StorageError(
        `Failed to write to MongoDB: ${error.message}`,
        'write_error'
      );
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const response = await fetch(`/api/storage?key=${encodeURIComponent(key)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete data');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error('Failed to delete data');
      }
    } catch (error) {
      throw new StorageError(
        `Failed to remove data from MongoDB: ${error.message}`,
        'write_error'
      );
    }
  }

  async clear(): Promise<void> {
    try {
      const response = await fetch('/api/storage?key=all', {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear data');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error('Failed to clear data');
      }
    } catch (error) {
      throw new StorageError(
        `Failed to clear MongoDB data: ${error.message}`,
        'write_error'
      );
    }
  }
}
