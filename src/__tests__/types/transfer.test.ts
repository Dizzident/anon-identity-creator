import { createTransferData } from '../../types/transfer'
import { Identity } from '../../types/identity'

describe('Transfer Data', () => {
  const mockIdentity: Identity = {
    id: 'test-id-123',
    name: 'Test Identity',
    publicKey: 'public-key-123',
    privateKey: 'private-key-123',
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    attributes: {
      givenName: 'John',
      familyName: 'Doe',
      email: 'john.doe@example.com'
    }
  }

  it('should create transfer data with correct structure', () => {
    const transferData = createTransferData(mockIdentity)

    expect(transferData).toMatchObject({
      version: '1.0.0',
      timestamp: expect.any(Number),
      identity: {
        id: 'test-id-123',
        name: 'Test Identity',
        publicKey: 'public-key-123',
        privateKey: 'private-key-123',
        createdAt: '2023-01-01T00:00:00.000Z',
        attributes: {
          givenName: 'John',
          familyName: 'Doe',
          email: 'john.doe@example.com'
        }
      },
      transferInfo: {
        transferId: expect.any(String),
        sourceApp: 'Anonymous Identity Creator',
        targetApp: 'Mobile App'
      },
      security: {
        checksum: expect.any(String)
      }
    })
  })

  it('should generate valid transfer ID', () => {
    const transferData = createTransferData(mockIdentity)
    
    // Transfer ID should be a non-empty string (crypto.randomUUID is mocked in setupTests)
    expect(transferData.transferInfo.transferId).toBeTruthy()
    expect(typeof transferData.transferInfo.transferId).toBe('string')
    expect(transferData.transferInfo.transferId.length).toBeGreaterThan(0)
  })

  it('should include recent timestamp', () => {
    const before = Date.now()
    const transferData = createTransferData(mockIdentity)
    const after = Date.now()

    expect(transferData.timestamp).toBeGreaterThanOrEqual(before)
    expect(transferData.timestamp).toBeLessThanOrEqual(after)
  })

  it('should handle Date objects in createdAt', () => {
    const transferData = createTransferData(mockIdentity)
    
    expect(transferData.identity.createdAt).toBe('2023-01-01T00:00:00.000Z')
  })

  it('should handle string dates in createdAt', () => {
    const identityWithStringDate: Identity = {
      ...mockIdentity,
      createdAt: '2023-06-15T12:30:00.000Z' as any
    }
    
    const transferData = createTransferData(identityWithStringDate)
    
    expect(transferData.identity.createdAt).toBe('2023-06-15T12:30:00.000Z')
  })

  it('should generate different checksums for different data', () => {
    const identity1 = { ...mockIdentity, name: 'Identity 1' }
    const identity2 = { ...mockIdentity, name: 'Identity 2' }
    
    const transfer1 = createTransferData(identity1)
    const transfer2 = createTransferData(identity2)
    
    expect(transfer1.security.checksum).not.toBe(transfer2.security.checksum)
  })

  it('should generate consistent checksums for same data', () => {
    // Mock crypto.randomUUID to return consistent values
    const originalRandomUUID = crypto.randomUUID
    crypto.randomUUID = jest.fn(() => 'consistent-uuid-123')
    
    // Mock Date.now to return consistent timestamp
    const originalDateNow = Date.now
    Date.now = jest.fn(() => 1234567890000)
    
    const transfer1 = createTransferData(mockIdentity)
    const transfer2 = createTransferData(mockIdentity)
    
    expect(transfer1.security.checksum).toBe(transfer2.security.checksum)
    
    // Restore original functions
    crypto.randomUUID = originalRandomUUID
    Date.now = originalDateNow
  })

  it('should include all identity attributes', () => {
    const identityWithManyAttributes: Identity = {
      ...mockIdentity,
      attributes: {
        givenName: 'Jane',
        familyName: 'Smith',
        email: 'jane@example.com',
        phone: '+1234567890',
        city: 'New York',
        isOver18: true,
        customField: 'custom value'
      }
    }
    
    const transferData = createTransferData(identityWithManyAttributes)
    
    expect(transferData.identity.attributes).toEqual({
      givenName: 'Jane',
      familyName: 'Smith',
      email: 'jane@example.com',
      phone: '+1234567890',
      city: 'New York',
      isOver18: true,
      customField: 'custom value'
    })
  })
})