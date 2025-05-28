import '@testing-library/jest-dom'

// Set consistent timezone for tests to avoid cross-environment issues
process.env.TZ = 'UTC'

// Mock crypto.randomUUID for tests
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => Math.random().toString(36).substring(2, 15),
  },
})

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
})