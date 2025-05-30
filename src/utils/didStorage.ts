import { DIDIdentity } from '../types/identity';

interface BaseDIDStorage {
  save(identities: DIDIdentity[]): Promise<void>
  load(): Promise<DIDIdentity[]>
  clear(): Promise<void>
  getStorageInfo?(): Promise<{ hash?: string; txHash?: string; gateway?: string }>
}

/**
 * Storage provider for DID identities
 * Provides in-memory, localStorage, sessionStorage, IndexedDB, and hybrid storage
 */
export class DIDStorageProvider implements BaseDIDStorage {
  private data: DIDIdentity[] = [];
  private storageType: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';

  constructor(storageType: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB' = 'memory') {
    this.storageType = storageType;
  }

  async save(identities: DIDIdentity[]): Promise<void> {
    // Serialize DID identities for storage
    const serialized = identities.map(identity => ({
      ...identity,
      createdAt: identity.createdAt instanceof Date ? identity.createdAt.toISOString() : identity.createdAt,
      lastUpdated: identity.lastUpdated instanceof Date ? identity.lastUpdated?.toISOString() : identity.lastUpdated,
    }));

    switch (this.storageType) {
      case 'memory':
        this.data = identities;
        break;
      case 'localStorage':
        window.localStorage.setItem('did-identities', JSON.stringify(serialized));
        break;
      case 'sessionStorage':
        window.sessionStorage.setItem('did-identities', JSON.stringify(serialized));
        break;
      case 'indexedDB':
        await this.saveToIndexedDB(serialized);
        break;
    }
  }

  async load(): Promise<DIDIdentity[]> {
    let stored: any[];

    switch (this.storageType) {
      case 'memory':
        stored = this.data;
        break;
      case 'localStorage':
        const localData = window.localStorage.getItem('did-identities');
        stored = localData ? JSON.parse(localData) : [];
        break;
      case 'sessionStorage':
        const sessionData = window.sessionStorage.getItem('did-identities');
        stored = sessionData ? JSON.parse(sessionData) : [];
        break;
      case 'indexedDB':
        stored = await this.loadFromIndexedDB();
        break;
      default:
        stored = [];
    }
    
    if (!Array.isArray(stored)) {
      return [];
    }

    // Deserialize DID identities
    return stored.map(item => ({
      ...item,
      createdAt: new Date(item.createdAt),
      lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : undefined,
      // Ensure credentials are properly structured
      credentials: item.credentials || []
    }));
  }

  async clear(): Promise<void> {
    switch (this.storageType) {
      case 'memory':
        this.data = [];
        break;
      case 'localStorage':
        window.localStorage.removeItem('did-identities');
        break;
      case 'sessionStorage':
        window.sessionStorage.removeItem('did-identities');
        break;
      case 'indexedDB':
        await this.clearIndexedDB();
        break;
    }
  }

  async getStorageInfo(): Promise<{ hash?: string; txHash?: string; gateway?: string }> {
    return {};
  }

  private async saveToIndexedDB(identities: any[]): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(['identities'], 'readwrite');
    const store = transaction.objectStore('identities');
    
    // Clear existing data
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
    
    // Add new data
    for (const identity of identities) {
      await new Promise<void>((resolve, reject) => {
        const addRequest = store.add(identity);
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      });
    }
    
    db.close();
  }

  private async loadFromIndexedDB(): Promise<any[]> {
    const db = await this.openDB();
    const transaction = db.transaction(['identities'], 'readonly');
    const store = transaction.objectStore('identities');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        db.close();
        resolve(request.result);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  }

  private async clearIndexedDB(): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(['identities'], 'readwrite');
    const store = transaction.objectStore('identities');
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        db.close();
        resolve();
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('DIDIdentityDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('identities')) {
          db.createObjectStore('identities', { keyPath: 'id' });
        }
      };
    });
  }
}

/**
 * Hybrid storage provider that saves to multiple backends
 */
export class HybridDIDStorageProvider implements BaseDIDStorage {
  private providers: DIDStorageProvider[];

  constructor(providers: DIDStorageProvider[]) {
    this.providers = providers;
  }

  async save(identities: DIDIdentity[]): Promise<void> {
    await Promise.all(this.providers.map(p => p.save(identities)));
  }

  async load(): Promise<DIDIdentity[]> {
    // Load from the first available provider
    for (const provider of this.providers) {
      try {
        const data = await provider.load();
        if (data && data.length > 0) {
          return data;
        }
      } catch (error) {
        console.warn('Failed to load from provider:', error);
      }
    }
    return [];
  }

  async clear(): Promise<void> {
    await Promise.all(this.providers.map(p => p.clear()));
  }

  async getStorageInfo(): Promise<{ hash?: string; txHash?: string; gateway?: string }> {
    const infos = await Promise.all(
      this.providers.map(p => p.getStorageInfo?.() || Promise.resolve({}))
    );
    // Merge storage info from all providers
    return infos.reduce((acc, info) => ({ ...acc, ...info }), {});
  }
}

/**
 * Enhanced storage factory for DID identities
 */
export class DIDStorageFactory {
  static createMemoryStorage(): DIDStorageProvider {
    return new DIDStorageProvider('memory');
  }

  static createLocalStorage(): DIDStorageProvider {
    return new DIDStorageProvider('localStorage');
  }

  static createSessionStorage(): DIDStorageProvider {
    return new DIDStorageProvider('sessionStorage');
  }

  static createIndexedDBStorage(): DIDStorageProvider {
    return new DIDStorageProvider('indexedDB');
  }

  /**
   * Create a hybrid storage provider that saves to multiple backends
   */
  static createHybridStorage(providers: DIDStorageProvider[]): HybridDIDStorageProvider {
    return new HybridDIDStorageProvider(providers);
  }
}