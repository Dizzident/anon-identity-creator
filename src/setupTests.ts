import '@testing-library/jest-dom'

// Set consistent timezone for tests to avoid cross-environment issues
process.env.TZ = 'UTC'

// Mock crypto APIs for tests
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(36).substring(2, 15),
    subtle: {
      digest: async (algorithm: string, data: ArrayBuffer) => {
        // Simple mock implementation for SHA-256
        const bytes = new Uint8Array(data)
        let hash = 0
        for (let i = 0; i < bytes.length; i++) {
          hash = ((hash << 5) - hash) + bytes[i]
          hash = hash & hash // Convert to 32bit integer
        }
        // Return a 32-byte array for SHA-256
        const result = new Uint8Array(32)
        for (let i = 0; i < 32; i++) {
          result[i] = (hash >> (i % 4) * 8) & 0xff
        }
        return result.buffer
      }
    }
  },
})

// Add TextEncoder/TextDecoder polyfills for Jest
global.TextEncoder = require('util').TextEncoder
global.TextDecoder = require('util').TextDecoder

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
})