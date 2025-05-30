import { DIDIdentityService } from '../../services/didIdentityService'
import { DIDIdentity, IdentityAttributes } from '../../types/identity'

// Mock the anon-identity/browser module
jest.mock('anon-identity/browser', () => ({
  IdentityProvider: {
    create: jest.fn().mockResolvedValue({
      getDID: jest.fn().mockReturnValue('did:mock:identityprovider'),
      issueVerifiableCredential: jest.fn().mockResolvedValue({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'credential-123',
        type: ['VerifiableCredential'],
        credentialSubject: {
          id: 'did:mock:user123',
          givenName: 'John',
          familyName: 'Doe'
        },
        issuer: 'did:mock:identityprovider',
        issuanceDate: '2023-01-01T00:00:00Z',
        proof: {
          type: 'Ed25519Signature2020',
          created: '2023-01-01T00:00:00Z',
          proofPurpose: 'assertionMethod',
          verificationMethod: 'did:mock:identityprovider#key-1',
          jws: 'mock-proof'
        }
      })
    })
  },
  UserWallet: {
    create: jest.fn().mockResolvedValue({
      getDID: jest.fn().mockReturnValue('did:mock:user123'),
      getPublicKey: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4])),
      storeCredential: jest.fn(),
      createVerifiablePresentation: jest.fn().mockResolvedValue({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'presentation-123',
        type: ['VerifiablePresentation'],
        verifiableCredential: [{
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'credential-123',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:mock:user123',
            givenName: 'John'
          },
          issuer: 'did:mock:identityprovider',
          issuanceDate: '2023-01-01T00:00:00Z'
        }],
        holder: 'did:mock:user123',
        proof: {
          type: 'Ed25519Signature2020',
          created: '2023-01-01T00:00:00Z',
          proofPurpose: 'authentication',
          verificationMethod: 'did:mock:user123#key-1',
          jws: 'mock-proof'
        }
      })
    })
  },
  ServiceProvider: jest.fn().mockImplementation(() => ({
    verifyPresentation: jest.fn().mockResolvedValue({
      valid: true,
      errors: []
    })
  }))
}))

describe('DIDIdentityService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getIdentityProvider', () => {
    it('should create and return an identity provider', async () => {
      const { IdentityProvider } = require('anon-identity/browser')
      
      const idp = await DIDIdentityService.getIdentityProvider()
      
      expect(IdentityProvider.create).toHaveBeenCalledTimes(1)
      expect(idp).toBeDefined()
    })

    it('should return cached identity provider on subsequent calls', async () => {
      const { IdentityProvider } = require('anon-identity/browser')
      
      const idp1 = await DIDIdentityService.getIdentityProvider()
      const idp2 = await DIDIdentityService.getIdentityProvider()
      
      expect(IdentityProvider.create).toHaveBeenCalledTimes(1)
      expect(idp1).toBe(idp2)
    })
  })

  describe('getServiceProvider', () => {
    it('should create and return a service provider', async () => {
      const { ServiceProvider } = require('anon-identity/browser')
      
      const sp = await DIDIdentityService.getServiceProvider()
      
      expect(ServiceProvider).toHaveBeenCalledWith(
        'Anonymous Identity Creator',
        ['did:mock:identityprovider']
      )
      expect(sp).toBeDefined()
    })

    it('should return cached service provider on subsequent calls', async () => {
      const { ServiceProvider } = require('anon-identity/browser')
      
      const sp1 = await DIDIdentityService.getServiceProvider()
      const sp2 = await DIDIdentityService.getServiceProvider()
      
      expect(ServiceProvider).toHaveBeenCalledTimes(1)
      expect(sp1).toBe(sp2)
    })
  })

  describe('createDIDIdentity', () => {
    it('should create a DID identity with credentials', async () => {
      const attributes: IdentityAttributes = {
        givenName: 'John',
        familyName: 'Doe',
        email: 'john@example.com'
      }

      const identity = await DIDIdentityService.createDIDIdentity('John Doe', attributes)

      expect(identity).toMatchObject({
        id: 'did:mock:user123',
        name: 'John Doe',
        did: {
          id: 'did:mock:user123',
          publicKey: expect.any(Uint8Array)
        },
        credentials: expect.arrayContaining([
          expect.objectContaining({
            id: 'credential-123',
            credentialSubject: expect.objectContaining({
              id: 'did:mock:user123',
              givenName: 'John',
              familyName: 'Doe'
            })
          })
        ]),
        createdAt: expect.any(Date),
        lastUpdated: expect.any(Date)
      })
    })

    it('should handle errors during identity creation', async () => {
      const { UserWallet } = require('anon-identity/browser')
      UserWallet.create.mockRejectedValueOnce(new Error('Creation failed'))

      await expect(
        DIDIdentityService.createDIDIdentity('Test', { givenName: 'Test' })
      ).rejects.toThrow('Creation failed')
    })

    it('should store credential in wallet', async () => {
      const { UserWallet } = require('anon-identity/browser')
      const mockWallet = await UserWallet.create()

      const attributes: IdentityAttributes = {
        givenName: 'Alice',
        familyName: 'Smith'
      }

      await DIDIdentityService.createDIDIdentity('Alice Smith', attributes)

      expect(mockWallet.storeCredential).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'credential-123',
          credentialSubject: expect.objectContaining({
            givenName: 'Alice',
            familyName: 'Smith'
          })
        })
      )
    })
  })

  describe('createVerifiablePresentation', () => {
    const mockIdentity: DIDIdentity = {
      id: 'did:mock:user123',
      name: 'Test Identity',
      did: {
        id: 'did:mock:user123',
        publicKey: new Uint8Array([1, 2, 3, 4])
      },
      credentials: [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'credential-123',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:mock:user123',
            givenName: 'John',
            familyName: 'Doe'
          },
          issuer: 'did:mock:identityprovider',
          issuanceDate: '2023-01-01T00:00:00Z',
          proof: {
            type: 'Ed25519Signature2020',
            created: '2023-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:mock:identityprovider#key-1',
            jws: 'mock-proof'
          }
        }
      ],
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      lastUpdated: new Date('2023-01-01T00:00:00.000Z')
    }

    it('should create verifiable presentation with all credentials', async () => {
      const presentation = await DIDIdentityService.createVerifiablePresentation(mockIdentity)

      expect(presentation).toMatchObject({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'presentation-123',
        type: ['VerifiablePresentation'],
        verifiableCredential: expect.arrayContaining([
          expect.objectContaining({
            id: 'credential-123'
          })
        ]),
        holder: 'did:mock:user123'
      })
    })

    it('should create verifiable presentation with specific credentials', async () => {
      const { UserWallet } = require('anon-identity/browser')
      const mockWallet = await UserWallet.create()

      await DIDIdentityService.createVerifiablePresentation(
        mockIdentity,
        ['credential-123']
      )

      expect(mockWallet.createVerifiablePresentation).toHaveBeenCalledWith(['credential-123'])
    })

    it('should store all credentials in wallet before creating presentation', async () => {
      const { UserWallet } = require('anon-identity/browser')
      const mockWallet = await UserWallet.create()

      await DIDIdentityService.createVerifiablePresentation(mockIdentity)

      expect(mockWallet.storeCredential).toHaveBeenCalledWith(mockIdentity.credentials[0])
    })

    it('should handle errors during presentation creation', async () => {
      const { UserWallet } = require('anon-identity/browser')
      UserWallet.create.mockRejectedValueOnce(new Error('Presentation failed'))

      await expect(
        DIDIdentityService.createVerifiablePresentation(mockIdentity)
      ).rejects.toThrow('Presentation failed')
    })
  })

  describe('verifyPresentation', () => {
    const mockPresentation = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      id: 'presentation-123',
      type: ['VerifiablePresentation'],
      verifiableCredential: [],
      holder: 'did:mock:user123'
    }

    it('should verify a valid presentation', async () => {
      const result = await DIDIdentityService.verifyPresentation(mockPresentation)

      expect(result).toBe(true)
    })

    it('should return false for invalid presentation', async () => {
      const mockServiceProvider = {
        verifyPresentation: jest.fn().mockResolvedValue({
          valid: false,
          errors: ['Invalid signature']
        })
      }
      
      const { ServiceProvider } = require('anon-identity/browser')
      ServiceProvider.mockImplementationOnce(() => mockServiceProvider)

      const result = await DIDIdentityService.verifyPresentation(mockPresentation)

      expect(result).toBe(false)
    })

    it('should handle verification errors', async () => {
      const mockServiceProvider = {
        verifyPresentation: jest.fn().mockRejectedValue(new Error('Verification failed'))
      }
      
      const { ServiceProvider } = require('anon-identity/browser')
      ServiceProvider.mockImplementationOnce(() => mockServiceProvider)

      const result = await DIDIdentityService.verifyPresentation(mockPresentation)

      expect(result).toBe(false)
    })
  })

  describe('addCredentialToIdentity', () => {
    const mockIdentity: DIDIdentity = {
      id: 'did:mock:user123',
      name: 'Test Identity',
      did: {
        id: 'did:mock:user123',
        publicKey: new Uint8Array([1, 2, 3, 4])
      },
      credentials: [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'existing-credential',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:mock:user123',
            givenName: 'John'
          },
          issuer: 'did:mock:identityprovider',
          issuanceDate: '2023-01-01T00:00:00Z',
          proof: {
            type: 'Ed25519Signature2020',
            created: '2023-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:mock:identityprovider#key-1',
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

      const updatedIdentity = await DIDIdentityService.addCredentialToIdentity(
        mockIdentity,
        newAttributes
      )

      expect(updatedIdentity.credentials).toHaveLength(2)
      expect(updatedIdentity.credentials[1]).toMatchObject({
        id: 'credential-123',
        credentialSubject: expect.objectContaining({
          id: 'did:mock:user123',
          email: 'john@example.com',
          age: 30
        })
      })
      expect(updatedIdentity.lastUpdated).toEqual(expect.any(Date))
    })

    it('should preserve existing credentials when adding new one', async () => {
      const newAttributes = { email: 'john@example.com' }

      const updatedIdentity = await DIDIdentityService.addCredentialToIdentity(
        mockIdentity,
        newAttributes
      )

      expect(updatedIdentity.credentials[0]).toEqual(mockIdentity.credentials[0])
    })

    it('should handle errors during credential addition', async () => {
      const { IdentityProvider } = require('anon-identity/browser')
      const mockIdp = {
        getDID: jest.fn().mockReturnValue('did:mock:identityprovider'),
        issueVerifiableCredential: jest.fn().mockRejectedValue(new Error('Issuance failed'))
      }
      IdentityProvider.create.mockResolvedValueOnce(mockIdp)

      await expect(
        DIDIdentityService.addCredentialToIdentity(mockIdentity, { email: 'test@example.com' })
      ).rejects.toThrow('Issuance failed')
    })
  })

  describe('convertLegacyIdentity', () => {
    it('should convert legacy identity to DID identity', () => {
      const legacyIdentity = {
        id: 'legacy-123',
        name: 'Legacy User',
        publicKey: 'legacy-public-key',
        privateKey: 'legacy-private-key',
        createdAt: new Date('2022-01-01T00:00:00.000Z'),
        attributes: {
          givenName: 'John',
          familyName: 'Doe'
        }
      }

      const didIdentity = DIDIdentityService.convertLegacyIdentity(legacyIdentity)

      expect(didIdentity).toMatchObject({
        id: 'legacy-123',
        name: 'Legacy User',
        did: {
          id: 'legacy-123',
          publicKey: expect.any(Uint8Array)
        },
        credentials: [],
        createdAt: new Date('2022-01-01T00:00:00.000Z'),
        lastUpdated: expect.any(Date)
      })
    })

    it('should handle legacy identity without createdAt', () => {
      const legacyIdentity = {
        id: 'legacy-123',
        name: 'Legacy User',
        publicKey: 'legacy-public-key',
        privateKey: 'legacy-private-key',
        attributes: {}
      }

      const didIdentity = DIDIdentityService.convertLegacyIdentity(legacyIdentity)

      expect(didIdentity.createdAt).toEqual(expect.any(Date))
    })
  })

  describe('extractAttributesFromCredentials', () => {
    it('should extract attributes from single credential', () => {
      const credentials = [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'credential-123',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:mock:user123',
            givenName: 'John',
            familyName: 'Doe',
            email: 'john@example.com'
          },
          issuer: 'did:mock:identityprovider',
          issuanceDate: '2023-01-01T00:00:00Z',
          proof: {
            type: 'Ed25519Signature2020',
            created: '2023-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:mock:identityprovider#key-1',
            jws: 'mock-proof'
          }
        }
      ]

      const attributes = DIDIdentityService.extractAttributesFromCredentials(credentials)

      expect(attributes).toEqual({
        givenName: 'John',
        familyName: 'Doe',
        email: 'john@example.com'
      })
    })

    it('should merge attributes from multiple credentials', () => {
      const credentials = [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'credential-1',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:mock:user123',
            givenName: 'John',
            familyName: 'Doe'
          },
          issuer: 'did:mock:identityprovider',
          issuanceDate: '2023-01-01T00:00:00Z',
          proof: {
            type: 'Ed25519Signature2020',
            created: '2023-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:mock:identityprovider#key-1',
            jws: 'mock-proof'
          }
        },
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'credential-2',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:mock:user123',
            email: 'john@example.com',
            age: 30
          },
          issuer: 'did:mock:identityprovider',
          issuanceDate: '2023-01-01T00:00:00Z',
          proof: {
            type: 'Ed25519Signature2020',
            created: '2023-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:mock:identityprovider#key-1',
            jws: 'mock-proof'
          }
        }
      ]

      const attributes = DIDIdentityService.extractAttributesFromCredentials(credentials)

      expect(attributes).toEqual({
        givenName: 'John',
        familyName: 'Doe',
        email: 'john@example.com',
        age: 30
      })
    })

    it('should exclude id field from attributes', () => {
      const credentials = [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'credential-123',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:mock:user123',
            givenName: 'John'
          },
          issuer: 'did:mock:identityprovider',
          issuanceDate: '2023-01-01T00:00:00Z',
          proof: {
            type: 'Ed25519Signature2020',
            created: '2023-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:mock:identityprovider#key-1',
            jws: 'mock-proof'
          }
        }
      ]

      const attributes = DIDIdentityService.extractAttributesFromCredentials(credentials)

      expect(attributes).toEqual({
        givenName: 'John'
      })
      expect(attributes).not.toHaveProperty('id')
    })

    it('should handle empty credentials array', () => {
      const attributes = DIDIdentityService.extractAttributesFromCredentials([])

      expect(attributes).toEqual({})
    })

    it('should handle credentials with invalid credentialSubject', () => {
      const credentials = [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'credential-123',
          type: ['VerifiableCredential'],
          credentialSubject: null,
          issuer: 'did:mock:identityprovider',
          issuanceDate: '2023-01-01T00:00:00Z',
          proof: {
            type: 'Ed25519Signature2020',
            created: '2023-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:mock:identityprovider#key-1',
            jws: 'mock-proof'
          }
        }
      ] as any

      const attributes = DIDIdentityService.extractAttributesFromCredentials(credentials)

      expect(attributes).toEqual({})
    })

    it('should handle overriding attributes from later credentials', () => {
      const credentials = [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'credential-1',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:mock:user123',
            givenName: 'John',
            email: 'old@example.com'
          },
          issuer: 'did:mock:identityprovider',
          issuanceDate: '2023-01-01T00:00:00Z',
          proof: {
            type: 'Ed25519Signature2020',
            created: '2023-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:mock:identityprovider#key-1',
            jws: 'mock-proof'
          }
        },
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'credential-2',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:mock:user123',
            email: 'new@example.com' // Should override the previous email
          },
          issuer: 'did:mock:identityprovider',
          issuanceDate: '2023-01-02T00:00:00Z',
          proof: {
            type: 'Ed25519Signature2020',
            created: '2023-01-02T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:mock:identityprovider#key-1',
            jws: 'mock-proof'
          }
        }
      ]

      const attributes = DIDIdentityService.extractAttributesFromCredentials(credentials)

      expect(attributes).toEqual({
        givenName: 'John',
        email: 'new@example.com' // Should be the newer value
      })
    })
  })
})