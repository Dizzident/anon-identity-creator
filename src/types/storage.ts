import { Identity } from './identity'

export type StorageType = 'memory' | 'localStorage' | 'sessionStorage'

export interface StorageProvider {
  type: StorageType
  save(identities: Identity[]): Promise<void>
  load(): Promise<Identity[]>
  clear(): Promise<void>
}

export interface StorageConfig {
  type: StorageType
  autoSave?: boolean
  encryptionKey?: string
}