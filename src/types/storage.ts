import { Identity } from './identity'

export type StorageType = 'memory' | 'localStorage' | 'sessionStorage' | 'ipfs' | 'blockchain'

export interface StorageProvider {
  type: StorageType
  save(identities: Identity[]): Promise<void>
  load(): Promise<Identity[]>
  clear(): Promise<void>
  getStorageInfo?(): Promise<{ hash?: string; txHash?: string; gateway?: string }>
}

export interface StorageConfig {
  type: StorageType
  autoSave?: boolean
  encryptionKey?: string
  ipfsGateway?: string
  blockchainNetwork?: 'ethereum' | 'polygon' | 'arbitrum'
  walletAddress?: string
}