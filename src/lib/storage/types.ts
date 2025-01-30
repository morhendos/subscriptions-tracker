export interface IStorageProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class StorageError extends Error {
  constructor(
    message: string,
    public code: 'storage_unavailable' | 'parse_error' | 'write_error' | 'read_error'
  ) {
    super(message);
    this.name = 'StorageError';
  }
}
