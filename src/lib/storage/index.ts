import { IStorageProvider } from './types';
import { LocalStorageProvider } from './localStorage';
import { MongoDBStorageProvider } from './mongodb';

let storageProvider: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (!storageProvider) {
    if (process.env.NODE_ENV === 'test') {
      // Use localStorage in test environment
      storageProvider = new LocalStorageProvider();
    } else {
      // Use MongoDB in development and production
      storageProvider = new MongoDBStorageProvider();
    }
  }
  return storageProvider;
}

// For testing or switching storage implementations
export function setStorageProvider(provider: IStorageProvider) {
  storageProvider = provider;
}

// Clear the provider (useful for testing)
export function clearStorageProvider() {
  storageProvider = null;
}

export * from './types';
