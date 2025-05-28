import { MemoryStorageProvider, LocalStorageProvider, SessionStorageProvider, createStorageProvider } from '../../utils/storage'
import { Identity } from '../../types/identity'

describe('Storage Providers', () => {
  const mockIdentities: Identity[] = [
    {
      id: '1',
      name: 'Test Identity 1',
      publicKey: 'public-key-1',
      privateKey: 'private-key-1',
      createdAt: new Date('2023-01-01'),
      attributes: {}
    },
    {
      id: '2',
      name: 'Test Identity 2',
      publicKey: 'public-key-2',
      privateKey: 'private-key-2',
      createdAt: new Date('2023-01-02'),
      attributes: {}
    }
  ]

  describe('MemoryStorageProvider', () => {
    let provider: MemoryStorageProvider

    beforeEach(() => {
      provider = new MemoryStorageProvider()
    })

    it('should save and load identities', async () => {
      await provider.save(mockIdentities)
      const loaded = await provider.load()
      expect(loaded).toEqual(mockIdentities)
    })

    it('should return empty array when no data', async () => {
      const loaded = await provider.load()
      expect(loaded).toEqual([])
    })

    it('should clear data', async () => {
      await provider.save(mockIdentities)
      await provider.clear()
      const loaded = await provider.load()
      expect(loaded).toEqual([])
    })

    it('should not share data between instances', async () => {
      const provider2 = new MemoryStorageProvider()
      await provider.save(mockIdentities)
      const loaded = await provider2.load()
      expect(loaded).toEqual([])
    })
  })

  describe('LocalStorageProvider', () => {
    let provider: LocalStorageProvider

    beforeEach(() => {
      localStorage.clear()
      provider = new LocalStorageProvider()
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('should save and load identities', async () => {
      await provider.save(mockIdentities)
      const loaded = await provider.load()
      expect(loaded).toEqual([
        {
          ...mockIdentities[0],
          createdAt: mockIdentities[0].createdAt.toISOString()
        },
        {
          ...mockIdentities[1],
          createdAt: mockIdentities[1].createdAt.toISOString()
        }
      ])
    })

    it('should persist data across instances', async () => {
      await provider.save(mockIdentities)
      const provider2 = new LocalStorageProvider()
      const loaded = await provider2.load()
      expect(loaded).toEqual([
        {
          ...mockIdentities[0],
          createdAt: mockIdentities[0].createdAt.toISOString()
        },
        {
          ...mockIdentities[1],
          createdAt: mockIdentities[1].createdAt.toISOString()
        }
      ])
    })

    it('should return empty array when no data', async () => {
      const loaded = await provider.load()
      expect(loaded).toEqual([])
    })

    it('should clear data', async () => {
      await provider.save(mockIdentities)
      await provider.clear()
      const loaded = await provider.load()
      expect(loaded).toEqual([])
    })

    it('should handle JSON parse errors gracefully', async () => {
      localStorage.setItem('anon-identities', 'invalid-json')
      const loaded = await provider.load()
      expect(loaded).toEqual([])
    })
  })

  describe('SessionStorageProvider', () => {
    let provider: SessionStorageProvider

    beforeEach(() => {
      sessionStorage.clear()
      provider = new SessionStorageProvider()
    })

    afterEach(() => {
      sessionStorage.clear()
    })

    it('should save and load identities', async () => {
      await provider.save(mockIdentities)
      const loaded = await provider.load()
      expect(loaded).toEqual([
        {
          ...mockIdentities[0],
          createdAt: mockIdentities[0].createdAt.toISOString()
        },
        {
          ...mockIdentities[1],
          createdAt: mockIdentities[1].createdAt.toISOString()
        }
      ])
    })

    it('should persist data across instances', async () => {
      await provider.save(mockIdentities)
      const provider2 = new SessionStorageProvider()
      const loaded = await provider2.load()
      expect(loaded).toEqual([
        {
          ...mockIdentities[0],
          createdAt: mockIdentities[0].createdAt.toISOString()
        },
        {
          ...mockIdentities[1],
          createdAt: mockIdentities[1].createdAt.toISOString()
        }
      ])
    })

    it('should return empty array when no data', async () => {
      const loaded = await provider.load()
      expect(loaded).toEqual([])
    })

    it('should clear data', async () => {
      await provider.save(mockIdentities)
      await provider.clear()
      const loaded = await provider.load()
      expect(loaded).toEqual([])
    })

    it('should handle JSON parse errors gracefully', async () => {
      sessionStorage.setItem('anon-identities', 'invalid-json')
      const loaded = await provider.load()
      expect(loaded).toEqual([])
    })
  })

  describe('createStorageProvider', () => {
    it('should create MemoryStorageProvider for memory type', () => {
      const provider = createStorageProvider('memory')
      expect(provider).toBeInstanceOf(MemoryStorageProvider)
      expect(provider.type).toBe('memory')
    })

    it('should create LocalStorageProvider for localStorage type', () => {
      const provider = createStorageProvider('localStorage')
      expect(provider).toBeInstanceOf(LocalStorageProvider)
      expect(provider.type).toBe('localStorage')
    })

    it('should create SessionStorageProvider for sessionStorage type', () => {
      const provider = createStorageProvider('sessionStorage')
      expect(provider).toBeInstanceOf(SessionStorageProvider)
      expect(provider.type).toBe('sessionStorage')
    })

    it('should create IPFSStorageProvider for ipfs type', () => {
      const provider = createStorageProvider('ipfs')
      expect(provider.type).toBe('ipfs')
    })

    it('should create BlockchainStorageProvider for blockchain type', () => {
      const provider = createStorageProvider('blockchain')
      expect(provider.type).toBe('blockchain')
    })

    it('should pass config to providers', () => {
      const ipfsProvider = createStorageProvider('ipfs', { ipfsGateway: 'https://custom.gateway/' })
      const blockchainProvider = createStorageProvider('blockchain', { blockchainNetwork: 'polygon' })
      
      expect(ipfsProvider.type).toBe('ipfs')
      expect(blockchainProvider.type).toBe('blockchain')
    })
  })
})