import { IPFSStorageProvider } from '../../utils/ipfsStorage'
import { Identity } from '../../types/identity'

describe('IPFSStorageProvider', () => {
  let provider: IPFSStorageProvider
  const mockIdentities: Identity[] = [
    {
      id: '1',
      name: 'Test Identity 1',
      publicKey: 'public-key-1',
      privateKey: 'private-key-1',
      createdAt: new Date('2023-01-01'),
      attributes: {}
    }
  ]

  beforeEach(() => {
    localStorage.clear()
    provider = new IPFSStorageProvider()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should have correct type', () => {
    expect(provider.type).toBe('ipfs')
  })

  it('should save identities and generate hash', async () => {
    await provider.save(mockIdentities)
    
    const storageInfo = await provider.getStorageInfo()
    expect(storageInfo.hash).toBeDefined()
    expect(storageInfo.hash).toMatch(/^Qm[a-zA-Z0-9]{44}$/)
    expect(storageInfo.gateway).toBe('https://ipfs.io/ipfs/')
  })

  it('should load saved identities', async () => {
    await provider.save(mockIdentities)
    const loaded = await provider.load()
    
    expect(loaded).toEqual([
      {
        ...mockIdentities[0],
        createdAt: mockIdentities[0].createdAt.toISOString()
      }
    ])
  })

  it('should return empty array when no data', async () => {
    const loaded = await provider.load()
    expect(loaded).toEqual([])
  })

  it('should clear reference but not data (immutable)', async () => {
    await provider.save(mockIdentities)
    const hashBefore = (await provider.getStorageInfo()).hash
    
    await provider.clear()
    
    const loaded = await provider.load()
    expect(loaded).toEqual([])
    
    const storageInfo = await provider.getStorageInfo()
    expect(storageInfo.hash).toBeUndefined()
    
    // Data should still exist in localStorage (simulating IPFS immutability)
    expect(localStorage.getItem(`ipfs-${hashBefore}`)).toBeDefined()
  })

  it('should use custom gateway', async () => {
    const customGateway = 'https://gateway.pinata.cloud/ipfs/'
    provider = new IPFSStorageProvider(customGateway)
    
    const storageInfo = await provider.getStorageInfo()
    expect(storageInfo.gateway).toBe(customGateway)
  })

  it('should handle save errors', async () => {
    // Mock crypto.subtle.digest to throw an error
    const originalDigest = crypto.subtle.digest
    crypto.subtle.digest = jest.fn().mockRejectedValue(new Error('Digest failed'))
    
    await expect(provider.save(mockIdentities)).rejects.toThrow()
    
    // Restore original function
    crypto.subtle.digest = originalDigest
  })
})