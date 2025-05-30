# Service Provider API Documentation

## 🎯 Overview

The ServiceProviderService provides comprehensive credential verification and session management capabilities. It serves as the core API for service providers who need to verify user credentials and manage secure sessions.

## 📋 API Interface

### Core Methods

#### `createPresentationRequest(requestData: VerificationRequestData): Promise<PresentationRequest>`

Creates a new presentation request for credential verification.

**Parameters:**
- `requestData`: Verification request configuration
  - `verifierId: string` - Unique identifier for the verifier
  - `verifierName: string` - Human-readable name of the verifier
  - `purpose: string` - Description of verification purpose
  - `presentationType: 'single' | 'batch'` - Type of verification
  - `requestedAttributes?: string[]` - Optional specific attributes to request
  - `expiresIn?: number` - Expiration time in minutes (default: 60)

**Returns:** `Promise<PresentationRequest>`
```typescript
interface PresentationRequest {
  id: string
  requesterId: string
  requesterName: string
  requestedAttributes: string[]
  purpose: string
  expiresAt: Date
  createdAt: Date
  status: 'pending' | 'approved' | 'denied' | 'expired'
}
```

**Example:**
```typescript
const request = await ServiceProviderService.createPresentationRequest({
  verifierId: 'sp-001',
  verifierName: 'Example Service',
  purpose: 'Age verification for service access',
  presentationType: 'single',
  requestedAttributes: ['isOver18', 'nationality'],
  expiresIn: 30
})
```

---

#### `verifyCredential(credential: VerifiableCredential, verifierId: string, verifierName: string): Promise<VerificationResult>`

Verifies a single verifiable credential.

**Parameters:**
- `credential: VerifiableCredential` - The credential to verify
- `verifierId: string` - Identifier of the verifying service
- `verifierName: string` - Name of the verifying service

**Returns:** `Promise<VerificationResult>`
```typescript
interface VerificationResult {
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
```

**Example:**
```typescript
const result = await ServiceProviderService.verifyCredential(
  userCredential,
  'sp-001',
  'Example Service'
)

if (result.isValid) {
  console.log('Credential is valid')
} else {
  console.error('Verification failed:', result.errors)
}
```

---

#### `verifyCredentialsBatch(credentials: VerifiableCredential[], verifierId: string, verifierName: string): Promise<BatchVerificationResult>`

Verifies multiple credentials in a single batch operation.

**Parameters:**
- `credentials: VerifiableCredential[]` - Array of credentials to verify
- `verifierId: string` - Identifier of the verifying service
- `verifierName: string` - Name of the verifying service

**Returns:** `Promise<BatchVerificationResult>`
```typescript
interface BatchVerificationResult {
  id: string
  overallResult: 'valid' | 'invalid' | 'partial'
  totalCredentials: number
  validCredentials: number
  invalidCredentials: number
  results: VerificationResult[]
  processedAt: Date
  processingTimeMs: number
}
```

**Example:**
```typescript
const batchResult = await ServiceProviderService.verifyCredentialsBatch(
  userCredentials,
  'sp-001',
  'Example Service'
)

console.log(`Verified ${batchResult.validCredentials}/${batchResult.totalCredentials} credentials`)
console.log(`Processing took ${batchResult.processingTimeMs}ms`)
```

---

#### `verifyPresentation(presentation: any, verifierId: string, verifierName: string): Promise<VerificationResult>`

Verifies a verifiable presentation containing one or more credentials.

**Parameters:**
- `presentation: any` - The verifiable presentation to verify
- `verifierId: string` - Identifier of the verifying service
- `verifierName: string` - Name of the verifying service

**Returns:** `Promise<VerificationResult>`

**Example:**
```typescript
const presentationData = JSON.parse(qrCodeData)
const result = await ServiceProviderService.verifyPresentation(
  presentationData,
  'sp-001',
  'Example Service'
)
```

---

## 🔐 Session Management API

#### `createSession(userId: string, serviceProviderId: string, serviceProviderName: string, durationMinutes?: number): Session`

Creates a new secure session for credential sharing.

**Parameters:**
- `userId: string` - Identifier of the user
- `serviceProviderId: string` - Identifier of the service provider
- `serviceProviderName: string` - Name of the service provider
- `durationMinutes?: number` - Session duration in minutes (default: 60)

**Returns:** `Session`
```typescript
interface Session {
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
```

**Example:**
```typescript
const session = ServiceProviderService.createSession(
  'user-123',
  'sp-001',
  'Example Service',
  120 // 2 hours
)
```

---

#### `getSession(sessionId: string): Session | null`

Retrieves a session by its ID and checks expiration status.

**Parameters:**
- `sessionId: string` - The session identifier

**Returns:** `Session | null`

**Example:**
```typescript
const session = ServiceProviderService.getSession('session-123')
if (session && session.status === 'active') {
  // Session is valid and active
  console.log(`Session expires at: ${session.expiresAt}`)
}
```

---

#### `updateSessionActivity(sessionId: string): boolean`

Updates the last activity timestamp for a session.

**Parameters:**
- `sessionId: string` - The session identifier

**Returns:** `boolean` - True if update was successful

**Example:**
```typescript
const updated = ServiceProviderService.updateSessionActivity('session-123')
if (updated) {
  console.log('Session activity updated')
}
```

---

#### `terminateSession(sessionId: string): boolean`

Terminates an active session immediately.

**Parameters:**
- `sessionId: string` - The session identifier

**Returns:** `boolean` - True if termination was successful

**Example:**
```typescript
const terminated = ServiceProviderService.terminateSession('session-123')
if (terminated) {
  console.log('Session terminated successfully')
}
```

---

#### `getActiveSessions(): Session[]`

Retrieves all currently active sessions.

**Returns:** `Session[]` - Array of active sessions

**Example:**
```typescript
const activeSessions = ServiceProviderService.getActiveSessions()
console.log(`Currently ${activeSessions.length} active sessions`)
```

---

## 📊 Verification History API

#### `getVerificationHistory(verifierId: string): VerificationResult[]`

Retrieves the verification history for a specific verifier.

**Parameters:**
- `verifierId: string` - The verifier identifier

**Returns:** `VerificationResult[]` - Array of verification results (last 100)

**Example:**
```typescript
const history = ServiceProviderService.getVerificationHistory('sp-001')
const validCount = history.filter(r => r.isValid).length
console.log(`${validCount}/${history.length} verifications were successful`)
```

---

## 🔍 Verification Process Details

### Verification Steps

1. **Signature Verification**
   - Validates cryptographic proof
   - Checks proof integrity
   - Verifies signature format

2. **Expiration Check**
   - Validates credential expiration date
   - Ensures credential is still valid
   - Checks issuance date validity

3. **Issuer Trust Validation**
   - Verifies issuer against trusted list
   - Validates issuer DID resolution
   - Checks issuer reputation

4. **Revocation Status Check**
   - Queries revocation registries
   - Validates revocation status
   - Ensures credential hasn't been revoked

### Verification Metadata

Each verification result includes detailed metadata:

```typescript
metadata: {
  signatureValid: boolean     // Cryptographic signature is valid
  notExpired: boolean        // Credential hasn't expired
  issuerTrusted: boolean     // Issuer is in trusted list
  revocationChecked: boolean // Revocation status verified
}
```

### Error Handling

The API provides comprehensive error information:

- **Errors**: Critical issues preventing verification
- **Warnings**: Non-critical issues that don't prevent verification
- **Status Codes**: Structured error classification

Example error handling:
```typescript
const result = await ServiceProviderService.verifyCredential(credential, 'sp-001', 'Service')

if (!result.isValid) {
  if (result.errors?.includes('Invalid signature')) {
    // Handle signature issues
  } else if (result.errors?.includes('Credential has expired')) {
    // Handle expiration
  }
}

if (result.warnings?.length > 0) {
  console.warn('Verification warnings:', result.warnings)
}
```

## 🔧 Configuration Options

### Service Provider Configuration

```typescript
interface ServiceProviderConfig {
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
```

### Performance Tuning

- **Batch Size**: Optimize batch verification size for performance
- **Caching**: Enable verification result caching for repeated checks
- **Parallel Processing**: Configure concurrent verification limits
- **Timeout Settings**: Adjust verification timeout values

## 🧪 Testing Examples

### Unit Testing Verification

```typescript
describe('ServiceProviderService', () => {
  it('should verify valid credentials', async () => {
    const result = await ServiceProviderService.verifyCredential(
      mockCredential,
      'test-verifier',
      'Test Service'
    )
    
    expect(result.isValid).toBe(true)
    expect(result.metadata.signatureValid).toBe(true)
  })
})
```

### Integration Testing

```typescript
it('should handle complete verification workflow', async () => {
  // Create presentation request
  const request = await ServiceProviderService.createPresentationRequest({
    verifierId: 'test-sp',
    verifierName: 'Test Provider',
    purpose: 'Testing',
    presentationType: 'single'
  })
  
  // Verify presentation
  const result = await ServiceProviderService.verifyPresentation(
    mockPresentation,
    'test-sp',
    'Test Provider'
  )
  
  expect(result.isValid).toBe(true)
})
```

This API provides a complete solution for credential verification and session management in decentralized identity systems.