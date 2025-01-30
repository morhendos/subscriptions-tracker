import { IStorageProvider } from './types';
import { LocalStorageProvider } from './localStorage';

let storageProvider: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (!storageProvider) {
    storageProvider = new LocalStorageProvider();
  }
  return storageProvider;
}

// For testing or switching storage implementations
export function setStorageProvider(provider: IStorageProvider) {
  storageProvider = provider;
}

export * from './types';
