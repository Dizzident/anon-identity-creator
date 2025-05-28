import { Identity } from '../types/identity'
import { StorageProvider, StorageType } from '../types/storage'

const STORAGE_KEY = 'anon-identities'

export class MemoryStorageProvider implements StorageProvider {
  type: StorageType = 'memory'
  private data: Identity[] = []

  async save(identities: Identity[]): Promise<void> {
    this.data = [...identities]
  }

  async load(): Promise<Identity[]> {
    return [...this.data]
  }

  async clear(): Promise<void> {
    this.data = []
  }
}

export class LocalStorageProvider implements StorageProvider {
  type: StorageType = 'localStorage'

  async save(identities: Identity[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(identities))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      throw error
    }
  }

  async load(): Promise<Identity[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return []
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export class SessionStorageProvider implements StorageProvider {
  type: StorageType = 'sessionStorage'

  async save(identities: Identity[]): Promise<void> {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(identities))
    } catch (error) {
      console.error('Failed to save to sessionStorage:', error)
      throw error
    }
  }

  async load(): Promise<Identity[]> {
    try {
      const data = sessionStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to load from sessionStorage:', error)
      return []
    }
  }

  async clear(): Promise<void> {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

export function createStorageProvider(type: StorageType): StorageProvider {
  switch (type) {
    case 'localStorage':
      return new LocalStorageProvider()
    case 'sessionStorage':
      return new SessionStorageProvider()
    case 'memory':
    default:
      return new MemoryStorageProvider()
  }
}