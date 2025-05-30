import { VerifiableCredential } from '../types/identity'
import { 
  VerificationResult, 
  BatchVerificationResult, 
  PresentationRequest, 
  Session,
  VerificationRequestData 
} from '../types/serviceProvider'
import { MockDIDService } from './mockDIDService'

/**
 * Service Provider Service for verifying credentials and managing sessions
 */
export class ServiceProviderService {
  private static sessions: Map<string, Session> = new Map()
  private static verificationHistory: Map<string, VerificationResult[]> = new Map()

  /**
   * Create a presentation request
   */
  static async createPresentationRequest(
    requestData: VerificationRequestData
  ): Promise<PresentationRequest> {
    const request: PresentationRequest = {
      id: crypto.randomUUID(),
      requesterId: requestData.verifierId,
      requesterName: requestData.verifierName,
      requestedAttributes: requestData.requestedAttributes || [],
      purpose: requestData.purpose,
      expiresAt: new Date(Date.now() + (requestData.expiresIn || 60) * 60 * 1000),
      createdAt: new Date(),
      status: 'pending'
    }

    return request
  }

  /**
   * Verify a single credential
   */
  static async verifyCredential(
    credential: VerifiableCredential,
    verifierId: string,
    verifierName: string
  ): Promise<VerificationResult> {

    try {
      // Simulate verification logic
      const result: VerificationResult = {
        isValid: true,
        verifiedAt: new Date(),
        verifierId,
        verifierName,
        credentialId: credential.id,
        issuer: credential.issuer,
        subject: credential.credentialSubject.id,
        metadata: {
          signatureValid: await this.verifySignature(credential),
          notExpired: this.checkExpiration(credential),
          issuerTrusted: await this.checkIssuerTrust(credential.issuer),
          revocationChecked: await this.checkRevocation(credential)
        }
      }

      // Determine overall validity
      const { signatureValid, notExpired, issuerTrusted, revocationChecked } = result.metadata
      result.isValid = signatureValid && notExpired && issuerTrusted && revocationChecked

      // Add warnings/errors
      if (!signatureValid) {
        result.errors = [...(result.errors || []), 'Invalid signature']
      }
      if (!notExpired) {
        result.errors = [...(result.errors || []), 'Credential has expired']
      }
      if (!issuerTrusted) {
        result.warnings = [...(result.warnings || []), 'Issuer not in trusted list']
      }
      if (!revocationChecked) {
        result.warnings = [...(result.warnings || []), 'Could not verify revocation status']
      }

      // Store verification result
      this.storeVerificationResult(verifierId, result)

      return result
    } catch (error) {
      const errorResult: VerificationResult = {
        isValid: false,
        verifiedAt: new Date(),
        verifierId,
        verifierName,
        credentialId: credential.id,
        issuer: credential.issuer,
        subject: credential.credentialSubject.id,
        errors: [`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        metadata: {
          signatureValid: false,
          notExpired: false,
          issuerTrusted: false,
          revocationChecked: false
        }
      }

      this.storeVerificationResult(verifierId, errorResult)
      return errorResult
    }
  }

  /**
   * Verify multiple credentials in batch
   */
  static async verifyCredentialsBatch(
    credentials: VerifiableCredential[],
    verifierId: string,
    verifierName: string
  ): Promise<BatchVerificationResult> {
    const startTime = Date.now()
    const batchId = crypto.randomUUID()

    try {
      // Verify all credentials
      const results = await Promise.all(
        credentials.map(credential => 
          this.verifyCredential(credential, verifierId, verifierName)
        )
      )

      const validCredentials = results.filter(r => r.isValid).length
      const invalidCredentials = results.length - validCredentials

      let overallResult: 'valid' | 'invalid' | 'partial'
      if (validCredentials === results.length) {
        overallResult = 'valid'
      } else if (validCredentials === 0) {
        overallResult = 'invalid'
      } else {
        overallResult = 'partial'
      }

      const batchResult: BatchVerificationResult = {
        id: batchId,
        overallResult,
        totalCredentials: credentials.length,
        validCredentials,
        invalidCredentials,
        results,
        processedAt: new Date(),
        processingTimeMs: Date.now() - startTime
      }

      return batchResult
    } catch (error) {
      throw new Error(`Batch verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Verify a DID identity presentation
   */
  static async verifyPresentation(
    presentation: any,
    verifierId: string,
    verifierName: string
  ): Promise<VerificationResult> {
    try {
      // Use MockDIDService to verify the presentation
      const isValid = await MockDIDService.verifyPresentation(presentation)
      
      const result: VerificationResult = {
        isValid,
        verifiedAt: new Date(),
        verifierId,
        verifierName,
        credentialId: presentation.id || 'presentation',
        issuer: presentation.holder || 'unknown',
        subject: presentation.holder || 'unknown',
        metadata: {
          signatureValid: isValid,
          notExpired: true,
          issuerTrusted: true,
          revocationChecked: true
        }
      }

      if (!isValid) {
        result.errors = ['Presentation verification failed']
      }

      this.storeVerificationResult(verifierId, result)
      return result
    } catch (error) {
      const errorResult: VerificationResult = {
        isValid: false,
        verifiedAt: new Date(),
        verifierId,
        verifierName,
        credentialId: 'presentation',
        issuer: 'unknown',
        subject: 'unknown',
        errors: [`Presentation verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        metadata: {
          signatureValid: false,
          notExpired: false,
          issuerTrusted: false,
          revocationChecked: false
        }
      }

      this.storeVerificationResult(verifierId, errorResult)
      return errorResult
    }
  }

  /**
   * Create a new session
   */
  static createSession(
    userId: string,
    serviceProviderId: string,
    serviceProviderName: string,
    durationMinutes: number = 60
  ): Session {
    const session: Session = {
      id: crypto.randomUUID(),
      userId,
      serviceProviderId,
      serviceProviderName,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000),
      lastActivityAt: new Date(),
      status: 'active',
      sharedCredentials: [],
      permissions: ['read_credentials'],
      metadata: {}
    }

    this.sessions.set(session.id, session)
    return session
  }

  /**
   * Get session by ID
   */
  static getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      session.status = 'expired'
      this.sessions.set(sessionId, session)
      return session
    }

    return session
  }

  /**
   * Update session activity
   */
  static updateSessionActivity(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session || session.status !== 'active') return false

    session.lastActivityAt = new Date()
    this.sessions.set(sessionId, session)
    return true
  }

  /**
   * Terminate session
   */
  static terminateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.status = 'terminated'
    this.sessions.set(sessionId, session)
    return true
  }

  /**
   * Get verification history for a verifier
   */
  static getVerificationHistory(verifierId: string): VerificationResult[] {
    return this.verificationHistory.get(verifierId) || []
  }

  /**
   * Get all active sessions
   */
  static getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active')
  }

  // Private helper methods
  private static async verifySignature(credential: VerifiableCredential): Promise<boolean> {
    // Simulate signature verification
    await new Promise(resolve => setTimeout(resolve, 100))
    return credential.proof && credential.proof.jws ? true : false
  }

  private static checkExpiration(credential: VerifiableCredential): boolean {
    // Check if credential has an expiration date
    if (!(credential as any).expirationDate) return true
    return new Date((credential as any).expirationDate) > new Date()
  }

  private static async checkIssuerTrust(_issuer: string): Promise<boolean> {
    // Simulate trusted issuer check
    await new Promise(resolve => setTimeout(resolve, 50))
    // For demo, consider all issuers trusted
    return true
  }

  private static async checkRevocation(_credential: VerifiableCredential): Promise<boolean> {
    // Simulate revocation check
    await new Promise(resolve => setTimeout(resolve, 75))
    // For demo, assume no credentials are revoked
    return true
  }

  private static storeVerificationResult(verifierId: string, result: VerificationResult): void {
    const history = this.verificationHistory.get(verifierId) || []
    history.push(result)
    // Keep only last 100 results
    if (history.length > 100) {
      history.splice(0, history.length - 100)
    }
    this.verificationHistory.set(verifierId, history)
  }
}