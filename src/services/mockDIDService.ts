// Mock DID service for browser compatibility
// This provides DID/VC functionality without Node.js dependencies

import { DIDIdentity, IdentityCredentialSubject, IdentityAttributes } from '../types/identity';

// Mock types that match anon-identity structure
interface MockDID {
  id: string;
  publicKey: Uint8Array;
}

interface MockVerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: {
    id: string;
    [key: string]: any;
  };
  proof?: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
  };
}

interface MockVerifiablePresentation {
  '@context': string[];
  type: string[];
  verifiableCredential: MockVerifiableCredential[];
  proof?: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
  };
}

export class MockDIDService {
  private static issuerDID: string = 'did:key:mock-issuer-123456789';

  static async createDIDIdentity(name: string, attributes: IdentityAttributes): Promise<DIDIdentity> {
    try {
      // Generate mock DID
      const didId = `did:key:mock-${crypto.randomUUID()}`;
      const publicKey = crypto.getRandomValues(new Uint8Array(32));
      
      const mockDID: MockDID = {
        id: didId,
        publicKey: publicKey
      };

      // Create mock credential
      const credentialId = `urn:uuid:${crypto.randomUUID()}`;
      const issuanceDate = new Date().toISOString();

      const credential: MockVerifiableCredential = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1'
        ],
        id: credentialId,
        type: ['VerifiableCredential', 'IdentityCredential'],
        issuer: this.issuerDID,
        issuanceDate,
        credentialSubject: {
          id: didId,
          ...attributes
        },
        proof: {
          type: 'Ed25519Signature2020',
          created: issuanceDate,
          proofPurpose: 'assertionMethod',
          verificationMethod: `${this.issuerDID}#keys-1`,
          jws: 'mock-signature-' + crypto.randomUUID()
        }
      };

      // Create DID identity
      const didIdentity: DIDIdentity = {
        id: didId,
        name,
        did: mockDID as any,
        credentials: [credential as any],
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      return didIdentity;
    } catch (error) {
      console.error('Failed to create mock DID identity:', error);
      throw error;
    }
  }

  static async createVerifiablePresentation(
    didIdentity: DIDIdentity,
    credentialIds?: string[]
  ): Promise<MockVerifiablePresentation> {
    try {
      // Filter credentials if specific IDs provided
      const credentialsToInclude = credentialIds 
        ? didIdentity.credentials.filter(c => credentialIds.includes(c.id))
        : didIdentity.credentials;

      const presentation: MockVerifiablePresentation = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1'
        ],
        type: ['VerifiablePresentation'],
        verifiableCredential: credentialsToInclude as any,
        proof: {
          type: 'Ed25519Signature2020',
          created: new Date().toISOString(),
          proofPurpose: 'authentication',
          verificationMethod: `${didIdentity.did.id}#keys-1`,
          jws: 'mock-presentation-signature-' + crypto.randomUUID()
        }
      };

      return presentation;
    } catch (error) {
      console.error('Failed to create verifiable presentation:', error);
      throw error;
    }
  }

  static async verifyPresentation(presentation: MockVerifiablePresentation): Promise<boolean> {
    try {
      // Mock verification - in real implementation this would verify signatures
      const hasValidCredentials = presentation.verifiableCredential.length > 0;
      const hasValidProof = presentation.proof ? presentation.proof.jws.startsWith('mock-') : false;
      
      return hasValidCredentials && hasValidProof;
    } catch (error) {
      console.error('Failed to verify presentation:', error);
      return false;
    }
  }

  static async addCredentialToIdentity(
    didIdentity: DIDIdentity,
    attributes: Partial<IdentityCredentialSubject>
  ): Promise<DIDIdentity> {
    try {
      const credentialId = `urn:uuid:${crypto.randomUUID()}`;
      const issuanceDate = new Date().toISOString();

      const newCredential: MockVerifiableCredential = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://w3id.org/security/suites/ed25519-2020/v1'
        ],
        id: credentialId,
        type: ['VerifiableCredential', 'IdentityCredential'],
        issuer: this.issuerDID,
        issuanceDate,
        credentialSubject: {
          id: didIdentity.did.id,
          ...attributes
        } as any, // Mock implementation - relaxed typing
        proof: {
          type: 'Ed25519Signature2020',
          created: issuanceDate,
          proofPurpose: 'assertionMethod',
          verificationMethod: `${this.issuerDID}#keys-1`,
          jws: 'mock-signature-' + crypto.randomUUID()
        }
      };

      const updatedIdentity: DIDIdentity = {
        ...didIdentity,
        credentials: [...didIdentity.credentials, newCredential as any],
        lastUpdated: new Date()
      };

      return updatedIdentity;
    } catch (error) {
      console.error('Failed to add credential to identity:', error);
      throw error;
    }
  }

  static extractAttributesFromCredentials(credentials: any[]): IdentityAttributes {
    const attributes: IdentityAttributes = {};
    
    credentials.forEach(credential => {
      if (credential.credentialSubject && typeof credential.credentialSubject === 'object') {
        Object.keys(credential.credentialSubject).forEach(key => {
          if (key !== 'id') {
            attributes[key] = credential.credentialSubject[key];
          }
        });
      }
    });
    
    return attributes;
  }

  static convertLegacyIdentity(legacyIdentity: any): DIDIdentity {
    const didId = `did:key:legacy-${legacyIdentity.id}`;
    const mockDID: MockDID = {
      id: didId,
      publicKey: crypto.getRandomValues(new Uint8Array(32)) // Mock public key
    };
    
    return {
      id: didId,
      name: legacyIdentity.name,
      did: mockDID as any,
      credentials: [], // Will need to be populated separately
      createdAt: legacyIdentity.createdAt || new Date(),
      lastUpdated: new Date()
    };
  }
}