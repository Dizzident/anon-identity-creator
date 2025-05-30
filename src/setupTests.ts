import '@testing-library/jest-dom'
import { setupGlobalCryptoMock, DefaultCryptoMocks } from './test-utils/crypto'

// Set consistent timezone for tests to avoid cross-environment issues
process.env.TZ = 'UTC'

// Setup comprehensive crypto mocking for all tests
// This provides a consistent crypto API mock that can be overridden in individual tests
setupGlobalCryptoMock({
  randomUUID: () => Math.random().toString(36).substring(2, 15),
  getRandomValues: DefaultCryptoMocks.simpleRandomValues,
  digest: DefaultCryptoMocks.mockDigest,
  generateKey: jest.fn(),
  exportKey: jest.fn()
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