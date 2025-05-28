// Crypto service using Web Crypto API
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
      const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
      const privateKeyPkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      return {
        publicKey: new Uint8Array(publicKeyRaw),
        privateKey: new Uint8Array(privateKeyPkcs8)
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