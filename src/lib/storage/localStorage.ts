import { IStorageProvider, StorageError } from './types';

export class LocalStorageProvider implements IStorageProvider {
  private isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      throw new StorageError('Local storage is not available', 'storage_unavailable');
    }

    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      throw new StorageError(`Failed to read from storage: ${error.message}`, 'read_error');
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.isAvailable()) {
      throw new StorageError('Local storage is not available', 'storage_unavailable');
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      throw new StorageError(`Failed to write to storage: ${error.message}`, 'write_error');
    }
  }

  async remove(key: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new StorageError('Local storage is not available', 'storage_unavailable');
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      throw new StorageError(`Failed to remove from storage: ${error.message}`, 'write_error');
    }
  }

  async clear(): Promise<void> {
    if (!this.isAvailable()) {
      throw new StorageError('Local storage is not available', 'storage_unavailable');
    }

    try {
      localStorage.clear();
    } catch (error) {
      throw new StorageError(`Failed to clear storage: ${error.message}`, 'write_error');
    }
  }
}
