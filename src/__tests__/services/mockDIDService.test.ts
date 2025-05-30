import { MockDIDService } from '../../services/mockDIDService'
import { DIDIdentity, IdentityAttributes } from '../../types/identity'

// Mock crypto.randomUUID and crypto.getRandomValues
const mockCrypto = {
  randomUUID: jest.fn(() => 'mock-uuid-12345'),
  getRandomValues: jest.fn((array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = i % 256
    }
    return array
  })
}

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
  configurable: true
})

describe('MockDIDService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createDIDIdentity', () => {
    it('should create a DID identity with credentials', async () => {
      const attributes: IdentityAttributes = {
        givenName: 'John',
        familyName: 'Doe',
        email: 'john@example.com'
      }

      const identity = await MockDIDService.createDIDIdentity('John Doe', attributes)

      expect(identity).toMatchObject({
        id: 'did:key:mock-mock-uuid-12345',
        name: 'John Doe',
        did: {
          id: 'did:key:mock-mock-uuid-12345',
          publicKey: expect.any(Uint8Array)
        },
        credentials: expect.arrayContaining([
          expect.objectContaining({
            '@context': expect.arrayContaining(['https://www.w3.org/2018/credentials/v1']),
            id: 'urn:uuid:mock-uuid-12345',
            type: ['VerifiableCredential', 'IdentityCredential'],
            issuer: 'did:key:mock-issuer-123456789',
            credentialSubject: expect.objectContaining({
              id: 'did:key:mock-mock-uuid-12345',
              givenName: 'John',
              familyName: 'Doe',
              email: 'john@example.com'
            }),
            proof: expect.objectContaining({
              type: 'Ed25519Signature2020',
              proofPurpose: 'assertionMethod'
            })
          })
        ]),
        createdAt: expect.any(Date),
        lastUpdated: expect.any(Date)
      })
    })

    it('should generate unique DID for each identity', async () => {
      // Mock different UUIDs for consecutive calls
      mockCrypto.randomUUID
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2')
        .mockReturnValueOnce('uuid-3')
        .mockReturnValueOnce('uuid-4')

      const identity1 = await MockDIDService.createDIDIdentity('User 1', { givenName: 'Alice' })
      const identity2 = await MockDIDService.createDIDIdentity('User 2', { givenName: 'Bob' })

      expect(identity1.id).toBe('did:key:mock-uuid-1')
      expect(identity2.id).toBe('did:key:mock-uuid-2')
      expect(identity1.credentials[0].id).toBe('urn:uuid:uuid-2')
      expect(identity2.credentials[0].id).toBe('urn:uuid:uuid-4')
    })

    it('should handle empty attributes', async () => {
      const identity = await MockDIDService.createDIDIdentity('Empty User', {})

      expect(identity.credentials[0].credentialSubject).toEqual({
        id: identity.did.id
      })
    })

    it('should include issuance date in credentials', async () => {
      const beforeTime = new Date()
      const identity = await MockDIDService.createDIDIdentity('Test User', { givenName: 'Test' })
      const afterTime = new Date()

      const issuanceDate = new Date(identity.credentials[0].issuanceDate)
      expect(issuanceDate.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(issuanceDate.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })

    it('should generate random public key', async () => {
      const identity = await MockDIDService.createDIDIdentity('Test User', {})

      expect(identity.did.publicKey).toBeInstanceOf(Uint8Array)
      expect(identity.did.publicKey.length).toBe(32)
      expect(mockCrypto.getRandomValues).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      // Mock crypto to throw error
      mockCrypto.randomUUID.mockImplementationOnce(() => {
        throw new Error('Crypto failed')
      })

      await expect(
        MockDIDService.createDIDIdentity('Failed User', {})
      ).rejects.toThrow('Crypto failed')
    })

    it('should create proof with correct structure', async () => {
      const identity = await MockDIDService.createDIDIdentity('Test User', {})
      const proof = identity.credentials[0].proof

      expect(proof).toMatchObject({
        type: 'Ed25519Signature2020',
        created: expect.any(String),
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:key:mock-issuer-123456789#keys-1',
        jws: expect.stringContaining('mock-signature-')
      })
    })
  })

  describe('createVerifiablePresentation', () => {
    const mockIdentity: DIDIdentity = {
      id: 'did:key:test123',
      name: 'Test Identity',
      did: {
        id: 'did:key:test123',
        publicKey: new Uint8Array([1, 2, 3, 4])
      },
      credentials: [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'cred-1',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:key:test123',
            givenName: 'John',
            familyName: 'Doe'
          },
          issuer: 'did:key:issuer',
          issuanceDate: '2023-01-01T00:00:00Z',
          proof: {
            type: 'Ed25519Signature2020',
            created: '2023-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:key:issuer#key-1',
            jws: 'mock-proof'
          }
        },
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'cred-2',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:key:test123',
            email: 'john@example.com'
          },
          issuer: 'did:key:issuer',
          issuanceDate: '2023-01-01T00:00:00Z',
          proof: {
            type: 'Ed25519Signature2020',
            created: '2023-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:key:issuer#key-1',
            jws: 'mock-proof'
          }
        }
      ],
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      lastUpdated: new Date('2023-01-01T00:00:00.000Z')
    }

    it('should create presentation with all credentials by default', async () => {
      const presentation = await MockDIDService.createVerifiablePresentation(mockIdentity)

      expect(presentation).toMatchObject({
        '@context': expect.arrayContaining(['https://www.w3.org/2018/credentials/v1']),
        type: ['VerifiablePresentation'],
        verifiableCredential: expect.arrayContaining([
          expect.objectContaining({ id: 'cred-1' }),
          expect.objectContaining({ id: 'cred-2' })
        ]),
        proof: expect.objectContaining({
          type: 'Ed25519Signature2020',
          proofPurpose: 'authentication',
          verificationMethod: 'did:key:test123#keys-1',
          jws: expect.stringContaining('mock-presentation-signature-')
        })
      })
    })

    it('should create presentation with specific credentials', async () => {
      const presentation = await MockDIDService.createVerifiablePresentation(
        mockIdentity, 
        ['cred-1']
      )

      expect(presentation.verifiableCredential).toHaveLength(1)
      expect(presentation.verifiableCredential[0].id).toBe('cred-1')
    })

    it('should filter out non-existent credential IDs', async () => {
      const presentation = await MockDIDService.createVerifiablePresentation(
        mockIdentity,
        ['cred-1', 'non-existent']
      )

      expect(presentation.verifiableCredential).toHaveLength(1)
      expect(presentation.verifiableCredential[0].id).toBe('cred-1')
    })

    it('should create empty presentation if no matching credentials', async () => {
      const presentation = await MockDIDService.createVerifiablePresentation(
        mockIdentity,
        ['non-existent']
      )

      expect(presentation.verifiableCredential).toHaveLength(0)
    })

    it('should include timestamp in proof', async () => {
      const beforeTime = new Date()
      const presentation = await MockDIDService.createVerifiablePresentation(mockIdentity)
      const afterTime = new Date()

      const createdDate = new Date(presentation.proof!.created)
      expect(createdDate.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(createdDate.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })

    it('should handle errors during presentation creation', async () => {
      // Mock randomUUID to throw error
      mockCrypto.randomUUID.mockImplementationOnce(() => {
        throw new Error('UUID generation failed')
      })

      await expect(
        MockDIDService.createVerifiablePresentation(mockIdentity)
      ).rejects.toThrow('UUID generation failed')
    })

    it('should handle identity with no credentials', async () => {
      const emptyIdentity = {
        ...mockIdentity,
        credentials: []
      }

      const presentation = await MockDIDService.createVerifiablePresentation(emptyIdentity)

      expect(presentation.verifiableCredential).toHaveLength(0)
    })
  })

  describe('verifyPresentation', () => {
    const validPresentation = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiablePresentation'],
      verifiableCredential: [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'cred-1',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:key:test123',
            givenName: 'John'
          },
          issuer: 'did:key:issuer',
          issuanceDate: '2023-01-01T00:00:00Z',
          proof: {
            type: 'Ed25519Signature2020',
            created: '2023-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:key:issuer#key-1',
            jws: 'mock-proof'
          }
        }
      ],
      proof: {
        type: 'Ed25519Signature2020',
        created: '2023-01-01T00:00:00Z',
        proofPurpose: 'authentication',
        verificationMethod: 'did:key:test123#keys-1',
        jws: 'mock-presentation-signature-12345'
      }
    }

    it('should verify valid presentation', async () => {
      const result = await MockDIDService.verifyPresentation(validPresentation)

      expect(result).toBe(true)
    })

    it('should reject presentation with no credentials', async () => {
      const emptyPresentation = {
        ...validPresentation,
        verifiableCredential: []
      }

      const result = await MockDIDService.verifyPresentation(emptyPresentation)

      expect(result).toBe(false)
    })

    it('should reject presentation with invalid proof', async () => {
      const invalidPresentation = {
        ...validPresentation,
        proof: {
          ...validPresentation.proof!,
          jws: 'invalid-signature'
        }
      }

      const result = await MockDIDService.verifyPresentation(invalidPresentation)

      expect(result).toBe(false)
    })

    it('should reject presentation with no proof', async () => {
      const noProofPresentation = {
        ...validPresentation,
        proof: undefined
      }

      const result = await MockDIDService.verifyPresentation(noProofPresentation)

      expect(result).toBe(false)
    })

    it('should handle verification errors gracefully', async () => {
      // Create a presentation that will cause an error during verification
      const malformedPresentation = null as any

      const result = await MockDIDService.verifyPresentation(malformedPresentation)

      expect(result).toBe(false)
    })

    it('should verify presentation with mock signature format', async () => {
      const mockSignaturePresentation = {
        ...validPresentation,
        proof: {
          ...validPresentation.proof!,
          jws: 'mock-valid-signature'
        }
      }

      const result = await MockDIDService.verifyPresentation(mockSignaturePresentation)

      expect(result).toBe(true)
    })
  })

  describe('addCredentialToIdentity', () => {
    const mockIdentity: DIDIdentity = {
      id: 'did:key:test123',
      name: 'Test Identity',
      did: {
        id: 'did:key:test123',
        publicKey: new Uint8Array([1, 2, 3, 4])
      },
      credentials: [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'existing-cred',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:key:test123',
            givenName: 'John'
          },
          issuer: 'did:key:issuer',
          issuanceDate: '2023-01-01T00:00:00Z',
          proof: {
            type: 'Ed25519Signature2020',
            created: '2023-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:key:issuer#key-1',
            jws: 'mock-proof'
          }
        }
      ],
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      lastUpdated: new Date('2023-01-01T00:00:00.000Z')
    }

    it('should add new credential to identity', async () => {
      const newAttributes = {
        email: 'john@example.com',
        age: 30
      }

      const updatedIdentity = await MockDIDService.addCredentialToIdentity(
        mockIdentity,
        newAttributes
      )

      expect(updatedIdentity.credentials).toHaveLength(2)
      expect(updatedIdentity.credentials[1]).toMatchObject({
        '@context': expect.arrayContaining(['https://www.w3.org/2018/credentials/v1']),
        id: 'urn:uuid:mock-uuid-12345',
        type: ['VerifiableCredential', 'IdentityCredential'],
        issuer: 'did:key:mock-issuer-123456789',
        credentialSubject: expect.objectContaining({
          id: 'did:key:test123',
          email: 'john@example.com',
          age: 30
        }),
        proof: expect.objectContaining({
          type: 'Ed25519Signature2020',
          jws: expect.stringContaining('mock-signature-')
        })
      })
    })

    it('should preserve existing credentials', async () => {
      const updatedIdentity = await MockDIDService.addCredentialToIdentity(
        mockIdentity,
        { email: 'john@example.com' }
      )

      expect(updatedIdentity.credentials[0]).toEqual(mockIdentity.credentials[0])
    })

    it('should update lastUpdated timestamp', async () => {
      const originalTimestamp = mockIdentity.lastUpdated.getTime()
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1))
      
      const updatedIdentity = await MockDIDService.addCredentialToIdentity(
        mockIdentity,
        { email: 'john@example.com' }
      )

      expect(updatedIdentity.lastUpdated.getTime()).toBeGreaterThan(originalTimestamp)
    })

    it('should handle empty attributes', async () => {
      const updatedIdentity = await MockDIDService.addCredentialToIdentity(
        mockIdentity,
        {}
      )

      expect(updatedIdentity.credentials).toHaveLength(2)
      expect(updatedIdentity.credentials[1].credentialSubject).toEqual({
        id: 'did:key:test123'
      })
    })

    it('should handle errors during credential addition', async () => {
      // Mock randomUUID to throw error
      mockCrypto.randomUUID.mockImplementationOnce(() => {
        throw new Error('Credential creation failed')
      })

      await expect(
        MockDIDService.addCredentialToIdentity(mockIdentity, { email: 'test@example.com' })
      ).rejects.toThrow('Credential creation failed')
    })

    it('should generate unique credential IDs', async () => {
      mockCrypto.randomUUID
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2')
        .mockReturnValueOnce('uuid-3')
        .mockReturnValueOnce('uuid-4')

      const updated1 = await MockDIDService.addCredentialToIdentity(
        mockIdentity,
        { email: 'test1@example.com' }
      )
      
      const updated2 = await MockDIDService.addCredentialToIdentity(
        updated1,
        { phone: '123-456-7890' }
      )

      expect(updated1.credentials[1].id).toBe('urn:uuid:uuid-1')
      expect(updated2.credentials[2].id).toBe('urn:uuid:uuid-3')
    })
  })

  describe('extractAttributesFromCredentials', () => {
    const mockCredentials = [
      {
        id: 'cred-1',
        credentialSubject: {
          id: 'did:key:test123',
          givenName: 'John',
          familyName: 'Doe',
          email: 'john@example.com'
        }
      },
      {
        id: 'cred-2',
        credentialSubject: {
          id: 'did:key:test123',
          age: 30,
          occupation: 'Developer'
        }
      }
    ]

    it('should extract attributes from single credential', () => {
      const attributes = MockDIDService.extractAttributesFromCredentials([mockCredentials[0]])

      expect(attributes).toEqual({
        givenName: 'John',
        familyName: 'Doe',
        email: 'john@example.com'
      })
    })

    it('should merge attributes from multiple credentials', () => {
      const attributes = MockDIDService.extractAttributesFromCredentials(mockCredentials)

      expect(attributes).toEqual({
        givenName: 'John',
        familyName: 'Doe',
        email: 'john@example.com',
        age: 30,
        occupation: 'Developer'
      })
    })

    it('should exclude id field from attributes', () => {
      const attributes = MockDIDService.extractAttributesFromCredentials(mockCredentials)

      expect(attributes).not.toHaveProperty('id')
    })

    it('should handle empty credentials array', () => {
      const attributes = MockDIDService.extractAttributesFromCredentials([])

      expect(attributes).toEqual({})
    })

    it('should handle credentials with invalid credentialSubject', () => {
      const invalidCredentials = [
        { id: 'cred-1', credentialSubject: null },
        { id: 'cred-2', credentialSubject: 'invalid' },
        { id: 'cred-3' } // Missing credentialSubject
      ]

      const attributes = MockDIDService.extractAttributesFromCredentials(invalidCredentials)

      expect(attributes).toEqual({})
    })

    it('should handle override of attributes from later credentials', () => {
      const credentialsWithOverride = [
        {
          id: 'cred-1',
          credentialSubject: {
            id: 'did:key:test123',
            email: 'old@example.com',
            name: 'John'
          }
        },
        {
          id: 'cred-2',
          credentialSubject: {
            id: 'did:key:test123',
            email: 'new@example.com', // This should override the previous email
            age: 30
          }
        }
      ]

      const attributes = MockDIDService.extractAttributesFromCredentials(credentialsWithOverride)

      expect(attributes).toEqual({
        email: 'new@example.com', // Should be the newer value
        name: 'John',
        age: 30
      })
    })
  })

  describe('convertLegacyIdentity', () => {
    const legacyIdentity = {
      id: 'legacy-123',
      name: 'Legacy User',
      publicKey: 'legacy-public-key',
      privateKey: 'legacy-private-key',
      createdAt: new Date('2022-01-01T00:00:00.000Z'),
      attributes: {
        givenName: 'John',
        familyName: 'Doe',
        email: 'john@example.com'
      }
    }

    it('should convert legacy identity to DID identity', () => {
      const didIdentity = MockDIDService.convertLegacyIdentity(legacyIdentity)

      expect(didIdentity).toMatchObject({
        id: 'did:key:legacy-legacy-123',
        name: 'Legacy User',
        did: {
          id: 'did:key:legacy-legacy-123',
          publicKey: expect.any(Uint8Array)
        },
        credentials: [],
        createdAt: new Date('2022-01-01T00:00:00.000Z'),
        lastUpdated: expect.any(Date)
      })
    })

    it('should generate mock public key', () => {
      const didIdentity = MockDIDService.convertLegacyIdentity(legacyIdentity)

      expect(didIdentity.did.publicKey).toBeInstanceOf(Uint8Array)
      expect(didIdentity.did.publicKey.length).toBe(32)
    })

    it('should handle legacy identity without createdAt', () => {
      const legacyWithoutDate = {
        ...legacyIdentity,
        createdAt: undefined
      }

      const didIdentity = MockDIDService.convertLegacyIdentity(legacyWithoutDate)

      expect(didIdentity.createdAt).toEqual(expect.any(Date))
    })

    it('should preserve original legacy ID in DID', () => {
      const didIdentity = MockDIDService.convertLegacyIdentity(legacyIdentity)

      expect(didIdentity.id).toBe('did:key:legacy-legacy-123')
      expect(didIdentity.did.id).toBe('did:key:legacy-legacy-123')
    })

    it('should set empty credentials array', () => {
      const didIdentity = MockDIDService.convertLegacyIdentity(legacyIdentity)

      expect(didIdentity.credentials).toEqual([])
    })

    it('should set lastUpdated to current time', () => {
      const beforeTime = new Date()
      const didIdentity = MockDIDService.convertLegacyIdentity(legacyIdentity)
      const afterTime = new Date()

      expect(didIdentity.lastUpdated.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(didIdentity.lastUpdated.getTime()).toBeLessThanOrEqual(afterTime.getTime())
    })
  })
})