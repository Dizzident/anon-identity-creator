import type { 
  VerifiableCredential, 
  DID 
} from 'anon-identity/browser';

// Re-export types for use in other modules
export type { VerifiableCredential, DID };

// Legacy interface for backward compatibility
export interface Identity {
  id: string;
  name: string;
  publicKey: string;
  privateKey: string;
  createdAt: Date;
  attributes: IdentityAttributes;
  // New DID/VC fields
  did?: DID;
  credentials?: VerifiableCredential[];
}

export interface IdentityAttributes {
  // Basic Profile
  givenName?: string;
  familyName?: string;
  dateOfBirth?: string;
  isOver18?: boolean;
  nationality?: string;
  occupation?: string;
  
  // Contact Information
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  
  // Allow additional custom attributes
  [key: string]: any;
}

// New DID-based identity interface
export interface DIDIdentity {
  id: string;
  name: string;
  did: DID;
  credentials: VerifiableCredential[];
  createdAt: Date;
  lastUpdated: Date;
}

// Credential subject for our identity schema
export interface IdentityCredentialSubject {
  id: DID;
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
  [key: string]: any;
}