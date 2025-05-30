# Identity Types Documentation

## 🎯 Overview

This document provides comprehensive documentation for all identity-related TypeScript types used throughout the Anonymous Identity Creator application. These types form the foundation of the identity management system and ensure type safety across the application.

## 📋 Core Identity Types

### Identity (Legacy)
**Purpose:** Legacy identity interface for backward compatibility
**Usage:** Used in legacy mode for simple key-pair based identities

```typescript
export interface Identity {
  id: string;                    // Unique identifier for the identity
  name: string;                  // Human-readable name
  publicKey: string;             // Public key for cryptographic operations
  privateKey: string;            // Private key (stored securely)
  createdAt: Date;               // Creation timestamp
  attributes: IdentityAttributes; // User attributes and claims
  
  // Optional DID/VC fields for migration
  did?: DID;                     // Decentralized Identifier
  credentials?: VerifiableCredential[]; // Associated credentials
}
```

**Example:**
```typescript
const legacyIdentity: Identity = {
  id: "identity-12345",
  name: "John Doe",
  publicKey: "04a1b2c3d4...",
  privateKey: "private-key-data",
  createdAt: new Date(),
  attributes: {
    givenName: "John",
    familyName: "Doe",
    email: "john@example.com"
  }
}
```

---

### DIDIdentity (Modern)
**Purpose:** Modern DID-based identity with verifiable credentials
**Usage:** Primary identity type for DID/VC mode operations

```typescript
export interface DIDIdentity {
  id: string;                    // Unique identifier
  name: string;                  // Human-readable name
  did: DID;                      // W3C-compliant Decentralized Identifier
  credentials: VerifiableCredential[]; // Array of verifiable credentials
  createdAt: Date;               // Creation timestamp
  lastUpdated: Date;             // Last modification timestamp
}
```

**Example:**
```typescript
const didIdentity: DIDIdentity = {
  id: "did-identity-12345",
  name: "Jane Smith",
  did: {
    id: "did:example:123456789abcdefghi",
    publicKey: new Uint8Array([...keyData])
  },
  credentials: [
    {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      id: "credential-abc123",
      type: ["VerifiableCredential"],
      credentialSubject: {
        id: "did:example:123456789abcdefghi",
        givenName: "Jane",
        familyName: "Smith",
        email: "jane@example.com"
      },
      issuer: "did:example:issuer123",
      issuanceDate: "2023-01-01T00:00:00Z",
      proof: {
        type: "Ed25519Signature2020",
        created: "2023-01-01T00:00:00Z",
        proofPurpose: "assertionMethod",
        verificationMethod: "did:example:issuer123#key-1",
        jws: "eyJ0eXAiOiJKV1QiLCJhbGciOiJFZERTQSJ9..."
      }
    }
  ],
  createdAt: new Date("2023-01-01"),
  lastUpdated: new Date()
}
```

---

## 🔑 W3C Standard Types

### DID (Decentralized Identifier)
**Purpose:** W3C-compliant Decentralized Identifier
**Source:** Re-exported from anon-identity/browser

```typescript
export interface DID {
  id: string;                    // DID string (e.g., "did:example:123")
  publicKey: Uint8Array;         // Public key material
}
```

**DID String Format:**
```
did:method:identifier
├─── DID scheme (always "did")
├─── Method name (e.g., "example", "key", "web")
└─── Method-specific identifier
```

---

### VerifiableCredential
**Purpose:** W3C-compliant Verifiable Credential
**Source:** Re-exported from anon-identity/browser

```typescript
export interface VerifiableCredential {
  "@context": string[];          // JSON-LD context
  id: string;                   // Unique credential identifier
  type: string[];               // Credential types
  credentialSubject: {          // Claims about the subject
    id: string;                 // Subject DID
    [key: string]: any;         // Flexible attribute structure
  };
  issuer: string;               // Issuer DID
  issuanceDate: string;         // ISO 8601 issuance date
  expirationDate?: string;      // Optional expiration date
  proof?: {                     // Cryptographic proof
    type: string;               // Proof type
    created: string;            // Proof creation date
    proofPurpose: string;       // Purpose of the proof
    verificationMethod: string; // Verification method reference
    jws: string;                // JSON Web Signature
  };
}
```

**Example Credential:**
```typescript
const credential: VerifiableCredential = {
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://www.w3.org/2018/credentials/examples/v1"
  ],
  id: "http://example.edu/credentials/3732",
  type: ["VerifiableCredential", "UniversityDegreeCredential"],
  credentialSubject: {
    id: "did:example:ebfeb1f712ebc6f1c276e12ec21",
    degree: {
      type: "BachelorDegree",
      name: "Bachelor of Science and Arts"
    }
  },
  issuer: "https://example.edu/issuers/565049",
  issuanceDate: "2010-01-01T19:23:24Z",
  proof: {
    type: "RsaSignature2018",
    created: "2017-06-18T21:19:10Z",
    proofPurpose: "assertionMethod",
    verificationMethod: "https://example.edu/issuers/keys/1",
    jws: "eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..."
  }
}
```

---

## 👤 Identity Attributes

### IdentityAttributes
**Purpose:** Flexible attribute structure for identity claims
**Usage:** Used in both legacy and DID modes for storing user attributes

```typescript
export interface IdentityAttributes {
  // Basic Profile Information
  givenName?: string;            // First name
  familyName?: string;           // Last name
  dateOfBirth?: string;          // ISO 8601 date string
  isOver18?: boolean;            // Age verification flag
  nationality?: string;          // Country of citizenship
  occupation?: string;           // Job title or profession
  
  // Contact Information
  email?: string;                // Email address
  phone?: string;                // Phone number
  street?: string;               // Street address
  city?: string;                 // City name
  state?: string;                // State/Province
  postalCode?: string;           // ZIP/Postal code
  country?: string;              // Country name
  
  // Extensible Design
  [key: string]: any;            // Allow additional custom attributes
}
```

**Example Usage:**
```typescript
const attributes: IdentityAttributes = {
  givenName: "Alice",
  familyName: "Johnson",
  dateOfBirth: "1990-05-15",
  isOver18: true,
  nationality: "US",
  occupation: "Software Engineer",
  email: "alice@example.com",
  phone: "+1-555-0123",
  street: "123 Main St",
  city: "Anytown",
  state: "CA",
  postalCode: "12345",
  country: "United States",
  // Custom attributes
  preferredLanguage: "en",
  membershipLevel: "premium"
}
```

---

### IdentityCredentialSubject
**Purpose:** Credential subject structure for identity credentials
**Usage:** Standardized structure for identity-related credential subjects

```typescript
export interface IdentityCredentialSubject {
  id: DID;                       // Subject's DID
  givenName?: string;
  familyName?: string;
  dateOfBirth?: string;
  isOver18?: boolean;
  nationality?: string;
  occupation?: string;
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  [key: string]: any;            // Extensible for custom claims
}
```

---

## 🔄 Type Relationships

### Type Hierarchy
```
Identity Types
├── Identity (Legacy)
│   ├── Basic key-pair structure
│   ├── Simple attribute storage
│   └── Optional DID migration fields
└── DIDIdentity (Modern)
    ├── W3C-compliant DID
    ├── Verifiable Credentials array
    └── Enhanced metadata

Credential Types
├── VerifiableCredential (W3C Standard)
│   ├── JSON-LD context
│   ├── Credential metadata
│   ├── Subject claims
│   └── Cryptographic proof
└── CredentialSubject
    ├── Subject DID reference
    └── Flexible claim structure
```

### Migration Path
```typescript
// Legacy to DID conversion utility
function convertLegacyToDID(legacy: Identity): DIDIdentity {
  return {
    id: legacy.id,
    name: legacy.name,
    did: legacy.did || generateNewDID(),
    credentials: legacy.credentials || generateCredentialsFromAttributes(legacy.attributes),
    createdAt: legacy.createdAt,
    lastUpdated: new Date()
  }
}
```

---

## 🛡️ Type Guards

### Identity Type Guards
**Purpose:** Runtime type checking for identity objects

```typescript
// Check if identity is DID-based
export function isDIDIdentity(identity: Identity | DIDIdentity): identity is DIDIdentity {
  return 'did' in identity && 'credentials' in identity && 'lastUpdated' in identity;
}

// Check if identity is legacy
export function isLegacyIdentity(identity: Identity | DIDIdentity): identity is Identity {
  return 'publicKey' in identity && 'privateKey' in identity;
}

// Validate credential structure
export function isValidVerifiableCredential(obj: any): obj is VerifiableCredential {
  return obj &&
    typeof obj === 'object' &&
    Array.isArray(obj['@context']) &&
    typeof obj.id === 'string' &&
    Array.isArray(obj.type) &&
    typeof obj.credentialSubject === 'object' &&
    typeof obj.issuer === 'string' &&
    typeof obj.issuanceDate === 'string';
}
```

**Usage Examples:**
```typescript
function processIdentity(identity: Identity | DIDIdentity) {
  if (isDIDIdentity(identity)) {
    // Handle DID identity
    console.log(`DID: ${identity.did.id}`);
    console.log(`Credentials: ${identity.credentials.length}`);
  } else {
    // Handle legacy identity
    console.log(`Public Key: ${identity.publicKey}`);
    console.log(`Attributes: ${Object.keys(identity.attributes).length}`);
  }
}
```

---

## 🎨 Type Utilities

### Attribute Extraction
```typescript
// Extract attributes from credentials
type CredentialAttributes<T extends VerifiableCredential> = 
  Omit<T['credentialSubject'], 'id'>;

// Merge multiple credential subjects
type MergedAttributes = CredentialAttributes<VerifiableCredential>;
```

### Optional Attribute Handling
```typescript
// Make all attributes optional for partial updates
type PartialIdentityAttributes = Partial<IdentityAttributes>;

// Required core attributes for identity creation
type RequiredIdentityData = Pick<IdentityAttributes, 'givenName' | 'familyName'>;
```

---

## 🔍 Validation Schemas

### Runtime Validation
```typescript
// Zod schema for identity attributes validation
import { z } from 'zod';

const IdentityAttributesSchema = z.object({
  givenName: z.string().min(1).optional(),
  familyName: z.string().min(1).optional(),
  dateOfBirth: z.string().datetime().optional(),
  isOver18: z.boolean().optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  // ... other validations
}).passthrough(); // Allow additional properties

// Usage
function validateAttributes(attributes: unknown): IdentityAttributes {
  return IdentityAttributesSchema.parse(attributes);
}
```

---

## 📊 Type Statistics

### Memory Usage Considerations
- **Legacy Identity**: ~200-500 bytes (basic attributes)
- **DID Identity**: ~1-5KB (with credentials and proofs)
- **Verifiable Credential**: ~500-2KB (depending on claims and proof size)

### Performance Implications
- Type guards add minimal runtime overhead
- Credential validation requires cryptographic operations
- Large credential arrays may impact serialization performance

---

## 🧪 Testing Types

### Type Testing Examples
```typescript
// Test type compatibility
describe('Identity Types', () => {
  it('should accept valid legacy identity', () => {
    const identity: Identity = createMockLegacyIdentity();
    expect(isLegacyIdentity(identity)).toBe(true);
  });
  
  it('should accept valid DID identity', () => {
    const identity: DIDIdentity = createMockDIDIdentity();
    expect(isDIDIdentity(identity)).toBe(true);
  });
  
  it('should validate credential structure', () => {
    const credential: VerifiableCredential = createMockCredential();
    expect(isValidVerifiableCredential(credential)).toBe(true);
  });
});
```

This type system provides a robust foundation for identity management while maintaining flexibility for future enhancements and ensuring compliance with W3C standards.