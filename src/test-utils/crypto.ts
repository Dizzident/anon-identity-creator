/**
 * Centralized crypto mocking utilities for tests
 * This file provides consistent crypto API mocking across all test files
 */

export interface MockCryptoOptions {
  randomUUID?: () => string
  getRandomValues?: (array: any) => any
  generateKey?: jest.Mock
  exportKey?: jest.Mock
  digest?: jest.Mock
}

/**
 * Creates a comprehensive crypto mock object
 */
export function createMockCrypto(options: MockCryptoOptions = {}) {
  const {
    randomUUID = () => `mock-uuid-${Math.random().toString(36).substring(2, 15)}`,
    getRandomValues = (array: any) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 256
      }
      return array
    },
    generateKey = jest.fn(),
    exportKey = jest.fn(),
    digest = jest.fn()
  } = options

  return {
    randomUUID: jest.fn(randomUUID),
    getRandomValues: jest.fn(getRandomValues),
    subtle: {
      generateKey: generateKey,
      exportKey: exportKey,
      digest: digest
    }
  }
}

/**
 * Sets up global crypto mock for tests
 */
export function setupGlobalCryptoMock(options: MockCryptoOptions = {}) {
  const mockCrypto = createMockCrypto(options)
  
  Object.defineProperty(global, 'crypto', {
    value: mockCrypto,
    writable: true,
    configurable: true
  })
  
  return mockCrypto
}

/**
 * Resets all crypto mock functions
 */
export function resetCryptoMocks(mockCrypto: any) {
  if (mockCrypto) {
    mockCrypto.randomUUID?.mockClear()
    mockCrypto.getRandomValues?.mockClear()
    mockCrypto.subtle?.generateKey?.mockClear()
    mockCrypto.subtle?.exportKey?.mockClear()
    mockCrypto.subtle?.digest?.mockClear()
  }
}

/**
 * Default crypto mock implementations for common use cases
 */
export const DefaultCryptoMocks = {
  // For basic UUID generation
  simpleUUID: () => 'mock-uuid-12345',
  
  // For sequential UUIDs (useful for testing unique generation)
  sequentialUUID: (() => {
    let counter = 0
    return () => `mock-uuid-${++counter}`
  })(),
  
  // For basic random values generation
  simpleRandomValues: (array: any) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = i % 256
    }
    return array
  },
  
  // For deterministic random values (useful for consistent tests)
  deterministicRandomValues: (seed: number = 123) => (array: any) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = (seed + i) % 256
    }
    return array
  },
  
  // For Web Crypto API key generation success
  successfulKeyGeneration: {
    generateKey: jest.fn().mockResolvedValue({
      publicKey: { type: 'public' },
      privateKey: { type: 'private' }
    }),
    exportKey: jest.fn()
      .mockResolvedValueOnce(new ArrayBuffer(65)) // P-256 public key
      .mockResolvedValueOnce(new ArrayBuffer(138)) // PKCS#8 private key
  },
  
  // For Web Crypto API key generation failure (fallback scenarios)
  failedKeyGeneration: {
    generateKey: jest.fn().mockRejectedValue(new Error('Web Crypto not supported')),
    exportKey: jest.fn().mockRejectedValue(new Error('Export failed'))
  },
  
  // For digest/hash operations
  mockDigest: jest.fn().mockImplementation(async (_algorithm: string, data: ArrayBuffer) => {
    // Simple mock implementation for SHA-256
    const bytes = new Uint8Array(data)
    let hash = 0
    for (let i = 0; i < bytes.length; i++) {
      hash = ((hash << 5) - hash) + bytes[i]
      hash = hash & hash // Convert to 32bit integer
    }
    // Return a 32-byte array for SHA-256
    const result = new Uint8Array(32)
    for (let i = 0; i < 32; i++) {
      result[i] = (hash >> (i % 4) * 8) & 0xff
    }
    return result.buffer
  })
}

/**
 * Crypto mock presets for specific test scenarios
 */
export const CryptoMockPresets = {
  // For testing DID service functionality
  didService: () => createMockCrypto({
    randomUUID: DefaultCryptoMocks.sequentialUUID,
    getRandomValues: DefaultCryptoMocks.simpleRandomValues
  }),
  
  // For testing crypto service with successful Web Crypto API
  cryptoServiceSuccess: () => createMockCrypto({
    getRandomValues: DefaultCryptoMocks.simpleRandomValues,
    generateKey: DefaultCryptoMocks.successfulKeyGeneration.generateKey,
    exportKey: DefaultCryptoMocks.successfulKeyGeneration.exportKey
  }),
  
  // For testing crypto service fallback scenarios
  cryptoServiceFallback: () => createMockCrypto({
    getRandomValues: DefaultCryptoMocks.simpleRandomValues,
    generateKey: DefaultCryptoMocks.failedKeyGeneration.generateKey,
    exportKey: DefaultCryptoMocks.failedKeyGeneration.exportKey
  }),
  
  // For testing storage providers
  storageProvider: () => createMockCrypto({
    randomUUID: DefaultCryptoMocks.simpleUUID,
    digest: DefaultCryptoMocks.mockDigest
  }),
  
  // For testing transfer functionality
  transfer: () => createMockCrypto({
    randomUUID: DefaultCryptoMocks.simpleUUID
  })
}