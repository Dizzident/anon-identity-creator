import { ServiceProviderService } from '../../services/serviceProviderService'
import { VerifiableCredential } from '../../types/identity'
import { VerificationRequestData } from '../../types/serviceProvider'

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn().mockReturnValue('mock-uuid-123')
  }
})

// Mock MockDIDService
jest.mock('../../services/mockDIDService', () => ({
  MockDIDService: {
    verifyPresentation: jest.fn().mockResolvedValue(true)
  }
}))

describe('ServiceProviderService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear service state
    ServiceProviderService['sessions'].clear()
    ServiceProviderService['verificationHistory'].clear()
  })

  const mockCredential: VerifiableCredential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'cred-1',
    type: ['VerifiableCredential'],
    credentialSubject: {
      id: 'did:mock:123',
      givenName: 'John',
      familyName: 'Doe',
      email: 'john@example.com'
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

  describe('createPresentationRequest', () => {
    it('should create a presentation request with default values', async () => {
      const requestData: VerificationRequestData = {
        verifierId: 'verifier-1',
        verifierName: 'Test Verifier',
        purpose: 'Identity verification',
        presentationType: 'single'
      }

      const request = await ServiceProviderService.createPresentationRequest(requestData)

      expect(request).toMatchObject({
        id: 'mock-uuid-123',
        requesterId: 'verifier-1',
        requesterName: 'Test Verifier',
        purpose: 'Identity verification',
        status: 'pending'
      })
      expect(request.expiresAt).toBeInstanceOf(Date)
      expect(request.createdAt).toBeInstanceOf(Date)
    })

    it('should create a presentation request with custom expiration', async () => {
      const requestData: VerificationRequestData = {
        verifierId: 'verifier-1',
        verifierName: 'Test Verifier',
        purpose: 'Identity verification',
        presentationType: 'single',
        expiresIn: 30
      }

      const request = await ServiceProviderService.createPresentationRequest(requestData)

      const expectedExpiration = new Date(Date.now() + 30 * 60 * 1000)
      expect(request.expiresAt.getTime()).toBeCloseTo(expectedExpiration.getTime(), -1000)
    })

    it('should include requested attributes in the request', async () => {
      const requestData: VerificationRequestData = {
        verifierId: 'verifier-1',
        verifierName: 'Test Verifier',
        purpose: 'Identity verification',
        presentationType: 'single',
        requestedAttributes: ['givenName', 'familyName']
      }

      const request = await ServiceProviderService.createPresentationRequest(requestData)

      expect(request.requestedAttributes).toEqual(['givenName', 'familyName'])
    })
  })

  describe('verifyCredential', () => {
    it('should verify a valid credential', async () => {
      const result = await ServiceProviderService.verifyCredential(
        mockCredential,
        'verifier-1',
        'Test Verifier'
      )

      expect(result.isValid).toBe(true)
      expect(result.credentialId).toBe('cred-1')
      expect(result.verifierId).toBe('verifier-1')
      expect(result.verifierName).toBe('Test Verifier')
      expect(result.metadata.signatureValid).toBe(true)
      expect(result.metadata.notExpired).toBe(true)
      expect(result.metadata.issuerTrusted).toBe(true)
      expect(result.metadata.revocationChecked).toBe(true)
    })

    it('should mark credential as invalid if signature is missing', async () => {
      const invalidCredential: VerifiableCredential = {
        ...mockCredential,
        proof: {
          type: mockCredential.proof!.type,
          created: mockCredential.proof!.created,
          proofPurpose: mockCredential.proof!.proofPurpose,
          verificationMethod: mockCredential.proof!.verificationMethod,
          jws: ''
        }
      }

      const result = await ServiceProviderService.verifyCredential(
        invalidCredential,
        'verifier-1',
        'Test Verifier'
      )

      expect(result.isValid).toBe(false)
      expect(result.metadata.signatureValid).toBe(false)
      expect(result.errors).toContain('Invalid signature')
    })

    it('should mark credential as invalid if expired', async () => {
      const expiredCredential = {
        ...mockCredential,
        expirationDate: '2022-01-01T00:00:00Z' // Past date
      }

      const result = await ServiceProviderService.verifyCredential(
        expiredCredential,
        'verifier-1',
        'Test Verifier'
      )

      expect(result.isValid).toBe(false)
      expect(result.metadata.notExpired).toBe(false)
      expect(result.errors).toContain('Credential has expired')
    })

    it('should store verification result in history', async () => {
      const result = await ServiceProviderService.verifyCredential(
        mockCredential,
        'verifier-1',
        'Test Verifier'
      )

      const history = ServiceProviderService.getVerificationHistory('verifier-1')
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual(result)
    })
  })

  describe('verifyCredentialsBatch', () => {
    it('should verify multiple credentials and return batch result', async () => {
      const credentials = [mockCredential, { ...mockCredential, id: 'cred-2' }]

      const result = await ServiceProviderService.verifyCredentialsBatch(
        credentials,
        'verifier-1',
        'Test Verifier'
      )

      expect(result.overallResult).toBe('valid')
      expect(result.totalCredentials).toBe(2)
      expect(result.validCredentials).toBe(2)
      expect(result.invalidCredentials).toBe(0)
      expect(result.results).toHaveLength(2)
      expect(result.processingTimeMs).toBeGreaterThan(0)
    })

    it('should handle mixed valid and invalid credentials', async () => {
      const invalidCredential: VerifiableCredential = {
        ...mockCredential,
        id: 'cred-2',
        proof: {
          type: mockCredential.proof!.type,
          created: mockCredential.proof!.created,
          proofPurpose: mockCredential.proof!.proofPurpose,
          verificationMethod: mockCredential.proof!.verificationMethod,
          jws: ''
        }
      }
      const credentials = [mockCredential, invalidCredential]

      const result = await ServiceProviderService.verifyCredentialsBatch(
        credentials,
        'verifier-1',
        'Test Verifier'
      )

      expect(result.overallResult).toBe('partial')
      expect(result.totalCredentials).toBe(2)
      expect(result.validCredentials).toBe(1)
      expect(result.invalidCredentials).toBe(1)
    })

    it('should return invalid overall result when all credentials are invalid', async () => {
      const invalidCredential: VerifiableCredential = {
        ...mockCredential,
        proof: {
          type: mockCredential.proof!.type,
          created: mockCredential.proof!.created,
          proofPurpose: mockCredential.proof!.proofPurpose,
          verificationMethod: mockCredential.proof!.verificationMethod,
          jws: ''
        }
      }
      const credentials = [invalidCredential, { ...invalidCredential, id: 'cred-2' }]

      const result = await ServiceProviderService.verifyCredentialsBatch(
        credentials,
        'verifier-1',
        'Test Verifier'
      )

      expect(result.overallResult).toBe('invalid')
      expect(result.validCredentials).toBe(0)
      expect(result.invalidCredentials).toBe(2)
    })
  })

  describe('verifyPresentation', () => {
    it('should verify a valid presentation', async () => {
      const mockPresentation = {
        id: 'presentation-1',
        type: 'VerifiablePresentation',
        holder: 'did:mock:123',
        verifiableCredential: [mockCredential]
      }

      const result = await ServiceProviderService.verifyPresentation(
        mockPresentation,
        'verifier-1',
        'Test Verifier'
      )

      expect(result.isValid).toBe(true)
      expect(result.credentialId).toBe('presentation-1')
      expect(result.subject).toBe('did:mock:123')
      expect(result.metadata.signatureValid).toBe(true)
    })

    it('should handle presentation verification failure', async () => {
      const { MockDIDService } = require('../../services/mockDIDService')
      MockDIDService.verifyPresentation.mockResolvedValueOnce(false)

      const mockPresentation = {
        id: 'presentation-1',
        type: 'VerifiablePresentation',
        holder: 'did:mock:123'
      }

      const result = await ServiceProviderService.verifyPresentation(
        mockPresentation,
        'verifier-1',
        'Test Verifier'
      )

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Presentation verification failed')
    })
  })

  describe('Session Management', () => {
    it('should create a new session', () => {
      const session = ServiceProviderService.createSession(
        'user-1',
        'sp-1',
        'Test Service Provider',
        120
      )

      expect(session).toMatchObject({
        id: 'mock-uuid-123',
        userId: 'user-1',
        serviceProviderId: 'sp-1',
        serviceProviderName: 'Test Service Provider',
        status: 'active'
      })
      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now())
      expect(session.sharedCredentials).toEqual([])
      expect(session.permissions).toEqual(['read_credentials'])
    })

    it('should retrieve a session by ID', () => {
      const session = ServiceProviderService.createSession(
        'user-1',
        'sp-1',
        'Test Service Provider'
      )

      const retrieved = ServiceProviderService.getSession(session.id)
      expect(retrieved).toEqual(session)
    })

    it('should return null for non-existent session', () => {
      const retrieved = ServiceProviderService.getSession('non-existent')
      expect(retrieved).toBeNull()
    })

    it('should mark expired sessions as expired', () => {
      const session = ServiceProviderService.createSession(
        'user-1',
        'sp-1',
        'Test Service Provider',
        0 // Expires immediately
      )

      // Wait a bit to ensure expiration
      const retrieved = ServiceProviderService.getSession(session.id)
      expect(retrieved?.status).toBe('expired')
    })

    it('should update session activity', () => {
      const session = ServiceProviderService.createSession(
        'user-1',
        'sp-1',
        'Test Service Provider'
      )

      const originalActivity = session.lastActivityAt
      
      // Wait a bit to ensure time difference
      setTimeout(() => {
        const updated = ServiceProviderService.updateSessionActivity(session.id)
        expect(updated).toBe(true)

        const retrieved = ServiceProviderService.getSession(session.id)
        expect(retrieved?.lastActivityAt.getTime()).toBeGreaterThan(originalActivity.getTime())
      }, 10)
    })

    it('should terminate a session', () => {
      const session = ServiceProviderService.createSession(
        'user-1',
        'sp-1',
        'Test Service Provider'
      )

      const terminated = ServiceProviderService.terminateSession(session.id)
      expect(terminated).toBe(true)

      const retrieved = ServiceProviderService.getSession(session.id)
      expect(retrieved?.status).toBe('terminated')
    })

    it('should get active sessions', () => {
      const session1 = ServiceProviderService.createSession('user-1', 'sp-1', 'Provider 1')
      const session2 = ServiceProviderService.createSession('user-2', 'sp-2', 'Provider 2')
      
      ServiceProviderService.terminateSession(session2.id)

      const activeSessions = ServiceProviderService.getActiveSessions()
      expect(activeSessions).toHaveLength(1)
      expect(activeSessions[0].id).toBe(session1.id)
    })
  })

  describe('Verification History', () => {
    it('should return empty history for new verifier', () => {
      const history = ServiceProviderService.getVerificationHistory('new-verifier')
      expect(history).toEqual([])
    })

    it('should maintain separate history for different verifiers', async () => {
      await ServiceProviderService.verifyCredential(mockCredential, 'verifier-1', 'Verifier 1')
      await ServiceProviderService.verifyCredential(mockCredential, 'verifier-2', 'Verifier 2')

      const history1 = ServiceProviderService.getVerificationHistory('verifier-1')
      const history2 = ServiceProviderService.getVerificationHistory('verifier-2')

      expect(history1).toHaveLength(1)
      expect(history2).toHaveLength(1)
      expect(history1[0].verifierName).toBe('Verifier 1')
      expect(history2[0].verifierName).toBe('Verifier 2')
    })

    it('should limit history to 100 entries', async () => {
      // Add 101 verification results
      for (let i = 0; i < 101; i++) {
        await ServiceProviderService.verifyCredential(
          { ...mockCredential, id: `cred-${i}` },
          'verifier-1',
          'Test Verifier'
        )
      }

      const history = ServiceProviderService.getVerificationHistory('verifier-1')
      expect(history).toHaveLength(100)
      // Should keep the most recent entries
      expect(history[history.length - 1].credentialId).toBe('cred-100')
    })
  })
})