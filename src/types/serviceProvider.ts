export interface PresentationRequest {
  id: string
  requesterId: string
  requesterName: string
  requestedAttributes: string[]
  purpose: string
  expiresAt: Date
  createdAt: Date
  status: 'pending' | 'approved' | 'denied' | 'expired'
}

export interface VerificationResult {
  isValid: boolean
  verifiedAt: Date
  verifierId: string
  verifierName: string
  credentialId: string
  issuer: string
  subject: string
  errors?: string[]
  warnings?: string[]
  metadata: {
    signatureValid: boolean
    notExpired: boolean
    issuerTrusted: boolean
    revocationChecked: boolean
  }
}

export interface BatchVerificationResult {
  id: string
  overallResult: 'valid' | 'invalid' | 'partial'
  totalCredentials: number
  validCredentials: number
  invalidCredentials: number
  results: VerificationResult[]
  processedAt: Date
  processingTimeMs: number
}

export interface Session {
  id: string
  userId: string
  serviceProviderId: string
  serviceProviderName: string
  createdAt: Date
  expiresAt: Date
  lastActivityAt: Date
  status: 'active' | 'expired' | 'terminated'
  sharedCredentials: string[]
  permissions: string[]
  metadata: Record<string, any>
}

export interface ServiceProviderConfig {
  id: string
  name: string
  description: string
  trustedIssuers: string[]
  requiredAttributes: string[]
  optionalAttributes: string[]
  sessionDurationMinutes: number
  allowBatchVerification: boolean
  requireSignedRequests: boolean
}

export interface VerificationRequestData {
  presentationType: 'single' | 'batch'
  requestedAttributes?: string[]
  purpose: string
  verifierId: string
  verifierName: string
  expiresIn?: number // minutes
}