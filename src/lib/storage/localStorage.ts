import { IStorageProvider, StorageError } from './types';

export class LocalStorageProvider implements IStorageProvider {
  private isAvailable(): boolean {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      throw new StorageError('Local storage is not available', 'storage_unavailable');
    }

    const item = localStorage.getItem(key);
    if (!item) return null;

    try {
      return JSON.parse(item) as T;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new StorageError(
        `Failed to read from storage: ${errorMessage}`,
        'read_error'
      );
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.isAvailable()) {
      throw new StorageError('Local storage is not available', 'storage_unavailable');
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new StorageError(
        `Failed to write to storage: ${errorMessage}`,
        'write_error'
      );
    }
  }

  async remove(key: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new StorageError('Local storage is not available', 'storage_unavailable');
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new StorageError(
        `Failed to remove from storage: ${errorMessage}`,
        'read_error'
      );
    }
  }

  async clear(): Promise<void> {
    if (!this.isAvailable()) {
      throw new StorageError('Local storage is not available', 'storage_unavailable');
    }

    try {
      localStorage.clear();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new StorageError(
        `Failed to clear storage: ${errorMessage}`,
        'write_error'
      );
    }
  }
}
