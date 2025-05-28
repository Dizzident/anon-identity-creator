import { Identity } from '../types/identity'
import { StorageProvider, StorageType } from '../types/storage'

const DEFAULT_IPFS_GATEWAY = 'https://ipfs.io/ipfs/'

export class IPFSStorageProvider implements StorageProvider {
  type: StorageType = 'ipfs'
  private gateway: string
  private lastHash: string | null = null

  constructor(gateway: string = DEFAULT_IPFS_GATEWAY) {
    this.gateway = gateway
  }

  async save(identities: Identity[]): Promise<void> {
    try {
      // In a real implementation, you would:
      // 1. Use an IPFS client library like ipfs-http-client
      // 2. Upload to IPFS via a service like Web3.Storage, Pinata, or Infura
      // For demo purposes, we'll simulate the upload
      
      const data = JSON.stringify(identities)
      
      // Simulate IPFS hash generation
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      
      // In reality, this would be the IPFS CID
      this.lastHash = `Qm${hashHex.substring(0, 44)}`
      
      // Store locally as fallback (in production, this would be the IPFS hash reference)
      localStorage.setItem('anon-identities-ipfs-hash', this.lastHash)
      localStorage.setItem(`ipfs-${this.lastHash}`, data)
      
      console.log(`Data saved to IPFS (simulated): ${this.lastHash}`)
    } catch (error) {
      console.error('Failed to save to IPFS:', error)
      throw error
    }
  }

  async load(): Promise<Identity[]> {
    try {
      const hash = localStorage.getItem('anon-identities-ipfs-hash')
      if (!hash) {
        return []
      }

      // In production, fetch from IPFS gateway
      // const response = await fetch(`${this.gateway}${hash}`)
      // const data = await response.json()
      
      // For demo, load from localStorage
      const data = localStorage.getItem(`ipfs-${hash}`)
      if (!data) {
        return []
      }

      const identities = JSON.parse(data)
      this.lastHash = hash
      return identities
    } catch (error) {
      console.error('Failed to load from IPFS:', error)
      return []
    }
  }

  async clear(): Promise<void> {
    // In IPFS, data is immutable, so we just clear the reference
    localStorage.removeItem('anon-identities-ipfs-hash')
    this.lastHash = null
  }

  async getStorageInfo(): Promise<{ hash?: string; gateway?: string }> {
    return {
      hash: this.lastHash || undefined,
      gateway: this.gateway
    }
  }
}