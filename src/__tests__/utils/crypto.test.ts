import { CryptoService } from '../../utils/crypto'
import { setupGlobalCryptoMock, resetCryptoMocks, CryptoMockPresets } from '../../test-utils/crypto'

describe('CryptoService', () => {
  let mockCrypto: any

  beforeEach(() => {
    // Setup crypto service specific mocking
    mockCrypto = setupGlobalCryptoMock({
      getRandomValues: jest.fn((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = i % 256
        }
        return array
      }),
      generateKey: jest.fn(),
      exportKey: jest.fn()
    })
  })

  afterEach(() => {
    resetCryptoMocks(mockCrypto)
  })

  describe('generateKeyPair', () => {
    it('should generate key pair using Web Crypto API', async () => {
      const mockKeyPair = {
        publicKey: {},
        privateKey: {}
      }
      
      const mockPublicKeyRaw = new ArrayBuffer(65) // P-256 uncompressed public key
      const mockPrivateKeyPkcs8 = new ArrayBuffer(138) // PKCS#8 private key

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKeyPair)
      mockCrypto.subtle.exportKey
        .mockResolvedValueOnce(mockPublicKeyRaw)
        .mockResolvedValueOnce(mockPrivateKeyPkcs8)

      const result = await CryptoService.generateKeyPair()

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        true,
        ['sign', 'verify']
      )

      expect(mockCrypto.subtle.exportKey).toHaveBeenCalledWith('raw', mockKeyPair.publicKey)
      expect(mockCrypto.subtle.exportKey).toHaveBeenCalledWith('pkcs8', mockKeyPair.privateKey)

      expect(result.publicKey).toBeInstanceOf(Uint8Array)
      expect(result.privateKey).toBeInstanceOf(Uint8Array)
      expect(result.publicKey.length).toBe(65)
      expect(result.privateKey.length).toBe(138)
    })

    it('should fallback to random key generation when Web Crypto API fails', async () => {
      mockCrypto.subtle.generateKey.mockRejectedValue(new Error('Web Crypto not supported'))
      
      const mockPublicKey = new Uint8Array(32)
      const mockPrivateKey = new Uint8Array(64)
      
      mockCrypto.getRandomValues
        .mockImplementationOnce((array) => {
          // Fill with test data
          for (let i = 0; i < array.length; i++) {
            array[i] = i % 256
          }
          return array
        })
        .mockImplementationOnce((array) => {
          // Fill with test data
          for (let i = 0; i < array.length; i++) {
            array[i] = (i + 100) % 256
          }
          return array
        })

      const result = await CryptoService.generateKeyPair()

      expect(mockCrypto.getRandomValues).toHaveBeenCalledTimes(2)
      expect(result.publicKey).toBeInstanceOf(Uint8Array)
      expect(result.privateKey).toBeInstanceOf(Uint8Array)
      expect(result.publicKey.length).toBe(32)
      expect(result.privateKey.length).toBe(64)
    })

    it('should handle export key errors by falling back to random generation', async () => {
      const mockKeyPair = {
        publicKey: {},
        privateKey: {}
      }

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKeyPair)
      mockCrypto.subtle.exportKey.mockRejectedValue(new Error('Export failed'))
      
      mockCrypto.getRandomValues.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = i % 256
        }
        return array
      })

      const result = await CryptoService.generateKeyPair()

      expect(mockCrypto.getRandomValues).toHaveBeenCalledTimes(2)
      expect(result.publicKey.length).toBe(32)
      expect(result.privateKey.length).toBe(64)
    })

    it('should generate different keys on subsequent calls', async () => {
      // Setup fallback mode
      mockCrypto.subtle.generateKey.mockRejectedValue(new Error('Not supported'))
      
      let callCount = 0
      mockCrypto.getRandomValues.mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = (i + callCount) % 256
        }
        callCount++
        return array
      })

      const result1 = await CryptoService.generateKeyPair()
      const result2 = await CryptoService.generateKeyPair()

      expect(result1.publicKey).not.toEqual(result2.publicKey)
      expect(result1.privateKey).not.toEqual(result2.privateKey)
    })

    it('should handle null/undefined Web Crypto API gracefully', async () => {
      // Temporarily replace crypto with null
      const originalCrypto = global.crypto
      ;(global as any).crypto = {
        subtle: null,
        getRandomValues: jest.fn().mockImplementation((array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = i % 256
          }
          return array
        })
      }

      const result = await CryptoService.generateKeyPair()

      expect(result.publicKey).toBeInstanceOf(Uint8Array)
      expect(result.privateKey).toBeInstanceOf(Uint8Array)

      // Restore original crypto
      global.crypto = originalCrypto
    })

    it('should validate key formats from Web Crypto API', async () => {
      const mockKeyPair = {
        publicKey: {},
        privateKey: {}
      }
      
      // Create valid-sized ArrayBuffers
      const mockPublicKeyRaw = new ArrayBuffer(65) // Valid P-256 public key size
      const mockPrivateKeyPkcs8 = new ArrayBuffer(138) // Valid PKCS#8 private key size

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKeyPair)
      mockCrypto.subtle.exportKey
        .mockResolvedValueOnce(mockPublicKeyRaw)
        .mockResolvedValueOnce(mockPrivateKeyPkcs8)

      const result = await CryptoService.generateKeyPair()

      // Verify the keys are properly converted to Uint8Array
      expect(result.publicKey).toBeInstanceOf(Uint8Array)
      expect(result.privateKey).toBeInstanceOf(Uint8Array)
      expect(result.publicKey.buffer).toBe(mockPublicKeyRaw)
      expect(result.privateKey.buffer).toBe(mockPrivateKeyPkcs8)
    })

    it('should use correct Web Crypto API parameters', async () => {
      mockCrypto.subtle.generateKey.mockResolvedValue({
        publicKey: {},
        privateKey: {}
      })
      mockCrypto.subtle.exportKey
        .mockResolvedValue(new ArrayBuffer(32))

      await CryptoService.generateKeyPair()

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        true, // extractable
        ['sign', 'verify'] // key usages
      )
    })

    it('should export keys in correct formats', async () => {
      const mockKeyPair = {
        publicKey: { type: 'public' },
        privateKey: { type: 'private' }
      }

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKeyPair)
      mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(32))

      await CryptoService.generateKeyPair()

      expect(mockCrypto.subtle.exportKey).toHaveBeenCalledWith('raw', mockKeyPair.publicKey)
      expect(mockCrypto.subtle.exportKey).toHaveBeenCalledWith('pkcs8', mockKeyPair.privateKey)
    })

    it('should handle empty ArrayBuffer from exportKey', async () => {
      const mockKeyPair = {
        publicKey: {},
        privateKey: {}
      }

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKeyPair)
      mockCrypto.subtle.exportKey
        .mockResolvedValueOnce(new ArrayBuffer(0))
        .mockResolvedValueOnce(new ArrayBuffer(0))

      const result = await CryptoService.generateKeyPair()

      expect(result.publicKey.length).toBe(0)
      expect(result.privateKey.length).toBe(0)
    })

    it('should preserve key data integrity', async () => {
      const mockKeyPair = {
        publicKey: {},
        privateKey: {}
      }
      
      // Create ArrayBuffers with specific data
      const publicKeyData = new ArrayBuffer(4)
      const privateKeyData = new ArrayBuffer(4)
      const publicView = new Uint8Array(publicKeyData)
      const privateView = new Uint8Array(privateKeyData)
      
      publicView[0] = 0x12
      publicView[1] = 0x34
      publicView[2] = 0x56
      publicView[3] = 0x78
      
      privateView[0] = 0x9A
      privateView[1] = 0xBC
      privateView[2] = 0xDE
      privateView[3] = 0xF0

      mockCrypto.subtle.generateKey.mockResolvedValue(mockKeyPair)
      mockCrypto.subtle.exportKey
        .mockResolvedValueOnce(publicKeyData)
        .mockResolvedValueOnce(privateKeyData)

      const result = await CryptoService.generateKeyPair()

      expect(Array.from(result.publicKey)).toEqual([0x12, 0x34, 0x56, 0x78])
      expect(Array.from(result.privateKey)).toEqual([0x9A, 0xBC, 0xDE, 0xF0])
    })
  })
})