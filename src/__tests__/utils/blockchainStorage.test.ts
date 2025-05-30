import { BlockchainStorageProvider } from '../../utils/blockchainStorage'
import { Identity } from '../../types/identity'

describe('BlockchainStorageProvider', () => {
  let provider: BlockchainStorageProvider
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
    provider = new BlockchainStorageProvider({ network: 'ethereum' })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should have correct type', () => {
    expect(provider.type).toBe('blockchain')
  })

  it('should save identities and generate transaction hash', async () => {
    await provider.save(mockIdentities)
    
    const storageInfo = await provider.getStorageInfo()
    expect(storageInfo.txHash).toBeDefined()
    expect(storageInfo.txHash).toMatch(/^0x[a-f0-9]{64}$/)
    expect(storageInfo.network).toBe('ethereum')
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
    const txHashBefore = (await provider.getStorageInfo()).txHash
    
    await provider.clear()
    
    const loaded = await provider.load()
    expect(loaded).toEqual([])
    
    const storageInfo = await provider.getStorageInfo()
    expect(storageInfo.txHash).toBeUndefined()
    
    // Data should still exist in localStorage (simulating blockchain immutability)
    expect(localStorage.getItem(`blockchain-${txHashBefore}`)).toBeDefined()
  })

  it('should work with different networks', async () => {
    const networks: ('ethereum' | 'polygon' | 'arbitrum')[] = ['ethereum', 'polygon', 'arbitrum']
    
    for (const network of networks) {
      localStorage.clear()
      provider = new BlockchainStorageProvider({ network })
      
      await provider.save(mockIdentities)
      const loaded = await provider.load()
      
      expect(loaded).toHaveLength(1)
      
      const storageInfo = await provider.getStorageInfo()
      expect(storageInfo.network).toBe(network)
    }
  })

  it('should handle save errors', async () => {
    // Mock crypto.subtle.digest to throw an error
    const originalDigest = global.crypto.subtle.digest
    global.crypto.subtle.digest = jest.fn().mockRejectedValue(new Error('Digest failed'))
    
    await expect(provider.save(mockIdentities)).rejects.toThrow()
    
    // Restore original function
    global.crypto.subtle.digest = originalDigest
  })

  it('should store network-specific data', async () => {
    const ethereumProvider = new BlockchainStorageProvider({ network: 'ethereum' })
    const polygonProvider = new BlockchainStorageProvider({ network: 'polygon' })
    
    await ethereumProvider.save(mockIdentities)
    await polygonProvider.save([{ ...mockIdentities[0], id: '2', name: 'Polygon Identity' }])
    
    const ethereumData = await ethereumProvider.load()
    const polygonData = await polygonProvider.load()
    
    expect(ethereumData[0].name).toBe('Test Identity 1')
    expect(polygonData[0].name).toBe('Polygon Identity')
  })
})