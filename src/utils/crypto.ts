// Wrapper for anon-identity's CryptoService to avoid bundling issues
// This uses the Web Crypto API directly which is what anon-identity's browser version should be doing

export class CryptoService {
  static async generateKeyPair(): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> {
    // Generate an Ed25519 key pair using Web Crypto API
    // Note: Ed25519 is not yet widely supported in browsers, so we'll use ECDSA as a fallback
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        true,
        ['sign', 'verify']
      );

      // Export the keys
      const publicKeyJwk = await crypto.subtle.exportKey('raw', keyPair.publicKey);
      const privateKeyJwk = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      return {
        publicKey: new Uint8Array(publicKeyJwk),
        privateKey: new Uint8Array(privateKeyJwk)
      };
    } catch (error) {
      // Fallback to a simple random key generation for demo purposes
      const publicKey = new Uint8Array(32);
      const privateKey = new Uint8Array(64);
      
      crypto.getRandomValues(publicKey);
      crypto.getRandomValues(privateKey);
      
      return { publicKey, privateKey };
    }
  }
}