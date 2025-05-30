import {
  IdentityProvider,
  UserWallet,
  ServiceProvider,
  VerifiableCredential,
  VerifiablePresentation
} from 'anon-identity/browser';
import type { DID } from 'anon-identity/browser';
import { DIDIdentity, IdentityCredentialSubject, IdentityAttributes } from '../types/identity';

export class DIDIdentityService {
  private static identityProvider: IdentityProvider | null = null;
  private static serviceProvider: ServiceProvider | null = null;

  static async getIdentityProvider(): Promise<IdentityProvider> {
    if (!this.identityProvider) {
      this.identityProvider = await IdentityProvider.create();
    }
    return this.identityProvider;
  }

  static async getServiceProvider(): Promise<ServiceProvider> {
    if (!this.serviceProvider) {
      const idp = await this.getIdentityProvider();
      this.serviceProvider = new ServiceProvider('Anonymous Identity Creator', [idp.getDID()]);
    }
    return this.serviceProvider;
  }

  static async createDIDIdentity(name: string, attributes: IdentityAttributes): Promise<DIDIdentity> {
    try {
      // Create user wallet
      const userWallet = await UserWallet.create();
      const userDID = userWallet.getDID();
      
      // Get identity provider
      const idp = await this.getIdentityProvider();
      
      // Prepare credential subject
      const credentialSubject: IdentityCredentialSubject = {
        id: userDID as any, // userDID is a string from getDID()
        ...attributes
      };
      
      // Issue verifiable credential
      const credential = await idp.issueVerifiableCredential(
        userDID,
        credentialSubject
      );
      
      // Store credential in wallet
      userWallet.storeCredential(credential);
      
      // Create DID object from string
      const didObject: DID = {
        id: userDID,
        publicKey: userWallet.getPublicKey()
      };
      
      // Create DID identity
      const didIdentity: DIDIdentity = {
        id: userDID,
        name,
        did: didObject,
        credentials: [credential],
        createdAt: new Date(),
        lastUpdated: new Date()
      };
      
      return didIdentity;
    } catch (error) {
      console.error('Failed to create DID identity:', error);
      throw error;
    }
  }

  static async createVerifiablePresentation(
    didIdentity: DIDIdentity,
    credentialIds?: string[]
  ): Promise<VerifiablePresentation> {
    try {
      // Create user wallet from DID identity
      const userWallet = await UserWallet.create();
      
      // Store credentials in wallet
      didIdentity.credentials.forEach(credential => {
        userWallet.storeCredential(credential);
      });
      
      // Create presentation with specified credentials or all credentials
      const presentationCredentialIds = credentialIds || didIdentity.credentials.map(c => c.id);
      const presentation = await userWallet.createVerifiablePresentation(presentationCredentialIds);
      
      return presentation;
    } catch (error) {
      console.error('Failed to create verifiable presentation:', error);
      throw error;
    }
  }

  static async verifyPresentation(presentation: VerifiablePresentation): Promise<boolean> {
    try {
      const sp = await this.getServiceProvider();
      const result = await sp.verifyPresentation(presentation);
      return result.valid;
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
      const idp = await this.getIdentityProvider();
      
      // Create new credential subject
      const credentialSubject: IdentityCredentialSubject = {
        id: didIdentity.did.id as any,
        ...attributes
      };
      
      // Issue new credential
      const newCredential = await idp.issueVerifiableCredential(
        didIdentity.did.id,
        credentialSubject
      );
      
      // Update identity with new credential
      const updatedIdentity: DIDIdentity = {
        ...didIdentity,
        credentials: [...didIdentity.credentials, newCredential],
        lastUpdated: new Date()
      };
      
      return updatedIdentity;
    } catch (error) {
      console.error('Failed to add credential to identity:', error);
      throw error;
    }
  }

  static convertLegacyIdentity(legacyIdentity: any): DIDIdentity {
    // Convert legacy identity format to DID identity
    // This is for backward compatibility during migration
    const mockDID: DID = {
      id: legacyIdentity.id,
      publicKey: new Uint8Array() // Mock for compatibility
    };
    
    return {
      id: legacyIdentity.id,
      name: legacyIdentity.name,
      did: mockDID,
      credentials: [], // Will need to be populated separately
      createdAt: legacyIdentity.createdAt || new Date(),
      lastUpdated: new Date()
    };
  }

  static extractAttributesFromCredentials(credentials: VerifiableCredential[]): IdentityAttributes {
    // Extract and merge attributes from all credentials
    const attributes: IdentityAttributes = {};
    
    credentials.forEach(credential => {
      if (credential.credentialSubject && typeof credential.credentialSubject === 'object') {
        Object.keys(credential.credentialSubject).forEach(key => {
          if (key !== 'id') {
            attributes[key] = (credential.credentialSubject as any)[key];
          }
        });
      }
    });
    
    return attributes;
  }
}