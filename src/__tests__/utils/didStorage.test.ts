import { DIDStorageProvider, HybridDIDStorageProvider, DIDStorageFactory } from '../../utils/didStorage'
import { DIDIdentity } from '../../types/identity'

// Mock IndexedDB
const mockIDBDatabase = {
  close: jest.fn(),
  createObjectStore: jest.fn(),
  transaction: jest.fn(),
  objectStoreNames: {
    contains: jest.fn()
  }
}

const mockIDBObjectStore = {
  add: jest.fn(),
  clear: jest.fn(),
  getAll: jest.fn()
}

const mockIDBTransaction = {
  objectStore: jest.fn().mockReturnValue(mockIDBObjectStore)
}

const mockIDBRequest = {
  onsuccess: null as any,
  onerror: null as any,
  onupgradeneeded: null as any,
  result: null as any,
  error: null as any
}

Object.defineProperty(global, 'indexedDB', {
  value: {
    open: jest.fn().mockImplementation(() => {
      const request = { ...mockIDBRequest }
      // Simulate successful open
      setTimeout(() => {
        request.result = mockIDBDatabase
        if (request.onsuccess) request.onsuccess()
      }, 0)
      return request
    })
  },
  writable: true
})

// Mock localStorage and sessionStorage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}

// Mock window object with storage
Object.defineProperty(global, 'localStorage', {
  value: mockStorage,
  writable: true,
  configurable: true
})

Object.defineProperty(global, 'sessionStorage', {
  value: mockStorage,
  writable: true,
  configurable: true
})

// Mock data used across all tests
const mockIdentities: DIDIdentity[] = [
    {
      id: 'did:mock:123',
      name: 'Test Identity 1',
      did: {
        id: 'did:mock:123',
        publicKey: new Uint8Array([1, 2, 3, 4])
      },
      credentials: [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'cred-1',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:mock:123',
            givenName: 'John',
            familyName: 'Doe'
          },
          issuer: 'did:mock:issuer',
          issuanceDate: '2023-01-01T00:00:00Z',
          proof: {
            type: 'Ed25519Signature2020',
            created: '2023-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:mock:issuer#key-1',
            jws: 'mock-proof'
          }
        }
      ],
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      lastUpdated: new Date('2023-01-01T00:00:00.000Z')
    },
    {
      id: 'did:mock:456',
      name: 'Test Identity 2',
      did: {
        id: 'did:mock:456',
        publicKey: new Uint8Array([5, 6, 7, 8])
      },
      credentials: [],
      createdAt: new Date('2023-01-02T00:00:00.000Z'),
      lastUpdated: new Date('2023-01-02T00:00:00.000Z')
    }
  ]

describe('DIDStorageProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIDBDatabase.transaction.mockReturnValue(mockIDBTransaction)
  })

  describe('Memory Storage', () => {
    let provider: DIDStorageProvider

    beforeEach(() => {
      provider = new DIDStorageProvider('memory')
    })

    it('should save and load identities from memory', async () => {
      await provider.save(mockIdentities)
      const loaded = await provider.load()

      expect(loaded).toHaveLength(2)
      expect(loaded[0].id).toBe('did:mock:123')
      expect(loaded[0].name).toBe('Test Identity 1')
      expect(loaded[0].createdAt).toBeInstanceOf(Date)
      expect(loaded[1].id).toBe('did:mock:456')
    })

    it('should clear identities from memory', async () => {
      await provider.save(mockIdentities)
      await provider.clear()
      const loaded = await provider.load()

      expect(loaded).toHaveLength(0)
    })

    it('should return empty array when no data saved', async () => {
      const loaded = await provider.load()
      expect(loaded).toEqual([])
    })

    it('should preserve credential data structure', async () => {
      await provider.save(mockIdentities)
      const loaded = await provider.load()

      expect(loaded[0].credentials).toHaveLength(1)
      expect(loaded[0].credentials[0].id).toBe('cred-1')
      expect(loaded[0].credentials[0].credentialSubject.givenName).toBe('John')
    })

    it('should handle identities without lastUpdated field', async () => {
      const identityWithoutLastUpdated = {
        ...mockIdentities[0],
        lastUpdated: undefined as any
      }

      await provider.save([identityWithoutLastUpdated])
      const loaded = await provider.load()

      expect(loaded[0].lastUpdated).toBeUndefined()
    })
  })

  describe('LocalStorage', () => {
    let provider: DIDStorageProvider

    beforeEach(() => {
      provider = new DIDStorageProvider('localStorage')
    })

    it('should save identities to localStorage', async () => {
      await provider.save(mockIdentities)

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'did-identities',
        expect.any(String)
      )

      const savedData = JSON.parse(mockStorage.setItem.mock.calls[0][1])
      expect(savedData).toHaveLength(2)
      expect(savedData[0].id).toBe('did:mock:123')
      expect(savedData[0].createdAt).toBe('2023-01-01T00:00:00.000Z')
    })

    it('should load identities from localStorage', async () => {
      const serializedData = JSON.stringify([
        {
          ...mockIdentities[0],
          createdAt: '2023-01-01T00:00:00.000Z',
          lastUpdated: '2023-01-01T00:00:00.000Z'
        }
      ])

      mockStorage.getItem.mockReturnValue(serializedData)

      const loaded = await provider.load()

      expect(mockStorage.getItem).toHaveBeenCalledWith('did-identities')
      expect(loaded).toHaveLength(1)
      expect(loaded[0].createdAt).toBeInstanceOf(Date)
      expect(loaded[0].lastUpdated).toBeInstanceOf(Date)
    })

    it('should handle empty localStorage', async () => {
      mockStorage.getItem.mockReturnValue(null)

      const loaded = await provider.load()

      expect(loaded).toEqual([])
    })

    it('should handle invalid JSON in localStorage', async () => {
      mockStorage.getItem.mockReturnValue('invalid json')

      await expect(provider.load()).rejects.toThrow()
    })

    it('should clear localStorage', async () => {
      await provider.clear()

      expect(mockStorage.removeItem).toHaveBeenCalledWith('did-identities')
    })

    it('should handle non-array data in localStorage', async () => {
      mockStorage.getItem.mockReturnValue('{"not": "an array"}')

      const loaded = await provider.load()

      expect(loaded).toEqual([])
    })
  })

  describe('SessionStorage', () => {
    let provider: DIDStorageProvider

    beforeEach(() => {
      provider = new DIDStorageProvider('sessionStorage')
      // Reset mock to distinguish between localStorage and sessionStorage calls
      mockStorage.getItem.mockClear()
      mockStorage.setItem.mockClear()
      mockStorage.removeItem.mockClear()
    })

    it('should save identities to sessionStorage', async () => {
      await provider.save(mockIdentities)

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'did-identities',
        expect.any(String)
      )
    })

    it('should load identities from sessionStorage', async () => {
      const serializedData = JSON.stringify([mockIdentities[0]])
      mockStorage.getItem.mockReturnValue(serializedData)

      const loaded = await provider.load()

      expect(mockStorage.getItem).toHaveBeenCalledWith('did-identities')
      expect(loaded).toHaveLength(1)
    })

    it('should clear sessionStorage', async () => {
      await provider.clear()

      expect(mockStorage.removeItem).toHaveBeenCalledWith('did-identities')
    })
  })

  describe('IndexedDB Storage', () => {
    let provider: DIDStorageProvider

    beforeEach(() => {
      provider = new DIDStorageProvider('indexedDB')
    })

    it('should save identities to IndexedDB', async () => {
      const mockAddRequest = { onsuccess: null, onerror: null }
      const mockClearRequest = { onsuccess: null, onerror: null }
      
      mockIDBObjectStore.clear.mockReturnValue(mockClearRequest)
      mockIDBObjectStore.add.mockReturnValue(mockAddRequest)

      const savePromise = provider.save(mockIdentities)

      // Simulate successful clear
      setTimeout(() => {
        if (mockClearRequest.onsuccess) mockClearRequest.onsuccess()
      }, 0)

      // Simulate successful adds
      setTimeout(() => {
        if (mockAddRequest.onsuccess) mockAddRequest.onsuccess()
      }, 10)

      await savePromise

      expect(mockIDBObjectStore.clear).toHaveBeenCalled()
      expect(mockIDBObjectStore.add).toHaveBeenCalledTimes(2)
      expect(mockIDBDatabase.close).toHaveBeenCalled()
    })

    it('should load identities from IndexedDB', async () => {
      const mockGetAllRequest = {
        onsuccess: null,
        onerror: null,
        result: [
          {
            ...mockIdentities[0],
            createdAt: '2023-01-01T00:00:00.000Z',
            lastUpdated: '2023-01-01T00:00:00.000Z'
          }
        ]
      }

      mockIDBObjectStore.getAll.mockReturnValue(mockGetAllRequest)

      const loadPromise = provider.load()

      // Simulate successful load
      setTimeout(() => {
        if (mockGetAllRequest.onsuccess) mockGetAllRequest.onsuccess()
      }, 0)

      const loaded = await loadPromise

      expect(mockIDBObjectStore.getAll).toHaveBeenCalled()
      expect(loaded).toHaveLength(1)
      expect(loaded[0].createdAt).toBeInstanceOf(Date)
      expect(mockIDBDatabase.close).toHaveBeenCalled()
    })

    it('should clear IndexedDB', async () => {
      const mockClearRequest = { onsuccess: null, onerror: null }
      mockIDBObjectStore.clear.mockReturnValue(mockClearRequest)

      const clearPromise = provider.clear()

      // Simulate successful clear
      setTimeout(() => {
        if (mockClearRequest.onsuccess) mockClearRequest.onsuccess()
      }, 0)

      await clearPromise

      expect(mockIDBObjectStore.clear).toHaveBeenCalled()
      expect(mockIDBDatabase.close).toHaveBeenCalled()
    })

    it('should handle IndexedDB errors during save', async () => {
      const mockClearRequest = { onsuccess: null, onerror: null, error: new Error('Clear failed') }
      mockIDBObjectStore.clear.mockReturnValue(mockClearRequest)

      const savePromise = provider.save(mockIdentities)

      // Simulate error
      setTimeout(() => {
        if (mockClearRequest.onerror) mockClearRequest.onerror()
      }, 0)

      await expect(savePromise).rejects.toThrow('Clear failed')
    })

    it('should handle IndexedDB errors during load', async () => {
      const mockGetAllRequest = {
        onsuccess: null,
        onerror: null,
        error: new Error('Load failed')
      }
      mockIDBObjectStore.getAll.mockReturnValue(mockGetAllRequest)

      const loadPromise = provider.load()

      // Simulate error
      setTimeout(() => {
        if (mockGetAllRequest.onerror) mockGetAllRequest.onerror()
      }, 0)

      await expect(loadPromise).rejects.toThrow('Load failed')
    })

    it('should create object store on upgrade', async () => {
      mockIDBDatabase.objectStoreNames.contains.mockReturnValue(false)

      const openRequest = global.indexedDB.open('DIDIdentityDB', 1)

      // Simulate upgrade needed
      setTimeout(() => {
        const upgradeEvent = {
          target: { result: mockIDBDatabase }
        }
        if (openRequest.onupgradeneeded) {
          openRequest.onupgradeneeded(upgradeEvent as any)
        }
      }, 0)

      expect(mockIDBDatabase.createObjectStore).toHaveBeenCalledWith('identities', { keyPath: 'id' })
    })

    it('should not create object store if it already exists', async () => {
      mockIDBDatabase.objectStoreNames.contains.mockReturnValue(true)

      const openRequest = global.indexedDB.open('DIDIdentityDB', 1)

      // Simulate upgrade needed
      setTimeout(() => {
        const upgradeEvent = {
          target: { result: mockIDBDatabase }
        }
        if (openRequest.onupgradeneeded) {
          openRequest.onupgradeneeded(upgradeEvent as any)
        }
      }, 0)

      expect(mockIDBDatabase.createObjectStore).not.toHaveBeenCalled()
    })
  })

  describe('Date Serialization', () => {
    let provider: DIDStorageProvider

    beforeEach(() => {
      provider = new DIDStorageProvider('memory')
    })

    it('should serialize and deserialize dates correctly', async () => {
      const testDate = new Date('2023-06-15T10:30:45.123Z')
      const identityWithDate = {
        ...mockIdentities[0],
        createdAt: testDate,
        lastUpdated: testDate
      }

      await provider.save([identityWithDate])
      const loaded = await provider.load()

      expect(loaded[0].createdAt).toBeInstanceOf(Date)
      expect(loaded[0].lastUpdated).toBeInstanceOf(Date)
      expect(loaded[0].createdAt.getTime()).toBe(testDate.getTime())
      expect(loaded[0].lastUpdated?.getTime()).toBe(testDate.getTime())
    })

    it('should handle string dates in loaded data', async () => {
      const provider = new DIDStorageProvider('localStorage')
      const serializedData = JSON.stringify([
        {
          ...mockIdentities[0],
          createdAt: '2023-01-01T00:00:00.000Z',
          lastUpdated: '2023-01-01T00:00:00.000Z'
        }
      ])

      mockStorage.getItem.mockReturnValue(serializedData)

      const loaded = await provider.load()

      expect(loaded[0].createdAt).toBeInstanceOf(Date)
      expect(loaded[0].lastUpdated).toBeInstanceOf(Date)
    })
  })

  describe('getStorageInfo', () => {
    it('should return empty object for storage info', async () => {
      const provider = new DIDStorageProvider('memory')
      const info = await provider.getStorageInfo()

      expect(info).toEqual({})
    })
  })
})

describe('HybridDIDStorageProvider', () => {
  let provider1: DIDStorageProvider
  let provider2: DIDStorageProvider
  let hybridProvider: HybridDIDStorageProvider

  beforeEach(() => {
    provider1 = new DIDStorageProvider('memory')
    provider2 = new DIDStorageProvider('memory')
    hybridProvider = new HybridDIDStorageProvider([provider1, provider2])
  })

  it('should save to all providers', async () => {
    const saveSpy1 = jest.spyOn(provider1, 'save')
    const saveSpy2 = jest.spyOn(provider2, 'save')

    await hybridProvider.save(mockIdentities)

    expect(saveSpy1).toHaveBeenCalledWith(mockIdentities)
    expect(saveSpy2).toHaveBeenCalledWith(mockIdentities)
  })

  it('should load from first available provider', async () => {
    await provider1.save(mockIdentities)
    await provider2.save([mockIdentities[1]])

    const loaded = await hybridProvider.load()

    expect(loaded).toHaveLength(2) // Should load from provider1
    expect(loaded[0].id).toBe('did:mock:123')
  })

  it('should try next provider if first fails', async () => {
    const loadSpy1 = jest.spyOn(provider1, 'load').mockRejectedValue(new Error('Load failed'))
    await provider2.save(mockIdentities)

    const loaded = await hybridProvider.load()

    expect(loadSpy1).toHaveBeenCalled()
    expect(loaded).toHaveLength(2) // Should load from provider2
  })

  it('should return empty array if all providers fail', async () => {
    jest.spyOn(provider1, 'load').mockRejectedValue(new Error('Failed'))
    jest.spyOn(provider2, 'load').mockRejectedValue(new Error('Failed'))

    const loaded = await hybridProvider.load()

    expect(loaded).toEqual([])
  })

  it('should clear all providers', async () => {
    const clearSpy1 = jest.spyOn(provider1, 'clear')
    const clearSpy2 = jest.spyOn(provider2, 'clear')

    await hybridProvider.clear()

    expect(clearSpy1).toHaveBeenCalled()
    expect(clearSpy2).toHaveBeenCalled()
  })

  it('should merge storage info from all providers', async () => {
    jest.spyOn(provider1, 'getStorageInfo').mockResolvedValue({ hash: 'hash1' })
    jest.spyOn(provider2, 'getStorageInfo').mockResolvedValue({ txHash: 'tx1' })

    const info = await hybridProvider.getStorageInfo()

    expect(info).toEqual({ hash: 'hash1', txHash: 'tx1' })
  })

  it('should handle providers without getStorageInfo', async () => {
    const provider3 = {
      save: jest.fn(),
      load: jest.fn(),
      clear: jest.fn()
      // No getStorageInfo method
    } as any

    const hybrid = new HybridDIDStorageProvider([provider3])
    const info = await hybrid.getStorageInfo()

    expect(info).toEqual({})
  })

  it('should skip providers with empty data', async () => {
    await provider1.save([]) // Empty data
    await provider2.save(mockIdentities)

    const loaded = await hybridProvider.load()

    expect(loaded).toHaveLength(2) // Should load from provider2
  })
})

describe('DIDStorageFactory', () => {
  it('should create memory storage provider', () => {
    const provider = DIDStorageFactory.createMemoryStorage()
    expect(provider).toBeInstanceOf(DIDStorageProvider)
  })

  it('should create localStorage provider', () => {
    const provider = DIDStorageFactory.createLocalStorage()
    expect(provider).toBeInstanceOf(DIDStorageProvider)
  })

  it('should create sessionStorage provider', () => {
    const provider = DIDStorageFactory.createSessionStorage()
    expect(provider).toBeInstanceOf(DIDStorageProvider)
  })

  it('should create IndexedDB provider', () => {
    const provider = DIDStorageFactory.createIndexedDBStorage()
    expect(provider).toBeInstanceOf(DIDStorageProvider)
  })

  it('should create hybrid storage provider', () => {
    const providers = [
      DIDStorageFactory.createMemoryStorage(),
      DIDStorageFactory.createLocalStorage()
    ]
    const hybrid = DIDStorageFactory.createHybridStorage(providers)
    expect(hybrid).toBeInstanceOf(HybridDIDStorageProvider)
  })
})