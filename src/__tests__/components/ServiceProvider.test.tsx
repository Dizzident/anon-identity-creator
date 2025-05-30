import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ServiceProvider } from '../../components/ServiceProvider'
import { DIDIdentity } from '../../types/identity'

// Mock the ServiceProviderService
jest.mock('../../services/serviceProviderService', () => ({
  ServiceProviderService: {
    createPresentationRequest: jest.fn().mockResolvedValue({
      id: 'req-123',
      requesterId: 'verifier-001',
      requesterName: 'Test Verifier',
      requestedAttributes: ['givenName', 'familyName'],
      purpose: 'Test verification',
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      status: 'pending'
    }),
    verifyCredential: jest.fn().mockResolvedValue({
      isValid: true,
      verifiedAt: new Date(),
      verifierId: 'verifier-001',
      verifierName: 'Test Verifier',
      credentialId: 'cred-1',
      issuer: 'did:mock:issuer',
      subject: 'did:mock:123',
      metadata: {
        signatureValid: true,
        notExpired: true,
        issuerTrusted: true,
        revocationChecked: true
      }
    }),
    verifyCredentialsBatch: jest.fn().mockResolvedValue({
      id: 'batch-123',
      overallResult: 'valid',
      totalCredentials: 2,
      validCredentials: 2,
      invalidCredentials: 0,
      results: [],
      processedAt: new Date(),
      processingTimeMs: 150
    }),
    getVerificationHistory: jest.fn().mockReturnValue([])
  }
}))

describe('ServiceProvider', () => {
  const mockIdentities: DIDIdentity[] = [
    {
      id: 'did-1',
      name: 'Test Identity 1',
      did: {
        id: 'did:mock:123',
        publicKey: new Uint8Array([1, 2, 3, 4])
      },
      credentials: [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'cred-1',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:mock:123',
            givenName: 'John',
            familyName: 'Doe',
            email: 'john@example.com'
          },
          issuer: 'did:mock:issuer',
          issuanceDate: '2023-01-01T00:00:00Z',
          proof: {
            type: 'Ed25519Signature2020',
            created: '2023-01-01T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:mock:issuer#key-1',
            jws: 'mock-proof'
          }
        }
      ],
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      lastUpdated: new Date('2023-01-01T00:00:00.000Z')
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the service provider interface', () => {
    render(<ServiceProvider identities={mockIdentities} />)
    
    expect(screen.getByText('🏢 Service Provider Interface')).toBeInTheDocument()
    expect(screen.getByText('Verify credentials and manage verification sessions')).toBeInTheDocument()
    expect(screen.getByText('Verification Configuration')).toBeInTheDocument()
  })

  it('should display verifier configuration form', () => {
    render(<ServiceProvider identities={mockIdentities} />)
    
    expect(screen.getByLabelText('Verifier ID:')).toBeInTheDocument()
    expect(screen.getByLabelText('Verifier Name:')).toBeInTheDocument()
    expect(screen.getByLabelText('Verification Purpose:')).toBeInTheDocument()
  })

  it('should show verification mode options', () => {
    render(<ServiceProvider identities={mockIdentities} />)
    
    expect(screen.getByText('🔍 Single Verification')).toBeInTheDocument()
    expect(screen.getByText('📊 Batch Verification')).toBeInTheDocument()
  })

  it('should display available identities for selection', () => {
    render(<ServiceProvider identities={mockIdentities} />)
    
    expect(screen.getByText('Select Identities to Verify')).toBeInTheDocument()
    expect(screen.getByText('Test Identity 1')).toBeInTheDocument()
    expect(screen.getByText('1 credential(s)')).toBeInTheDocument()
  })

  it('should show available attributes when identity is selected', () => {
    render(<ServiceProvider identities={mockIdentities} />)
    
    // Select an identity
    const identityCheckbox = screen.getByRole('checkbox', { name: /Test Identity 1/ })
    fireEvent.click(identityCheckbox)
    
    expect(screen.getByText('Available Attributes')).toBeInTheDocument()
    expect(screen.getByText('givenName')).toBeInTheDocument()
    expect(screen.getByText('familyName')).toBeInTheDocument()
    expect(screen.getByText('email')).toBeInTheDocument()
  })

  it('should create presentation request when button is clicked', async () => {
    const { ServiceProviderService } = require('../../services/serviceProviderService')
    
    render(<ServiceProvider identities={mockIdentities} />)
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Verifier ID:'), {
      target: { value: 'test-verifier' }
    })
    fireEvent.change(screen.getByLabelText('Verifier Name:'), {
      target: { value: 'Test Verifier' }
    })
    fireEvent.change(screen.getByLabelText('Verification Purpose:'), {
      target: { value: 'Test verification' }
    })
    
    // Click create request button
    const createButton = screen.getByText('📋 Create Presentation Request')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(ServiceProviderService.createPresentationRequest).toHaveBeenCalledWith({
        verifierId: 'test-verifier',
        verifierName: 'Test Verifier',
        purpose: 'Test verification',
        expiresIn: 60,
        presentationType: 'single',
        requestedAttributes: undefined
      })
    })
  })

  it('should verify credentials when verify button is clicked', async () => {
    const { ServiceProviderService } = require('../../services/serviceProviderService')
    
    render(<ServiceProvider identities={mockIdentities} />)
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Verifier ID:'), {
      target: { value: 'test-verifier' }
    })
    fireEvent.change(screen.getByLabelText('Verifier Name:'), {
      target: { value: 'Test Verifier' }
    })
    
    // Select an identity
    const identityCheckbox = screen.getByRole('checkbox', { name: /Test Identity 1/ })
    fireEvent.click(identityCheckbox)
    
    // Click verify button
    const verifyButton = screen.getByText('✅ Verify Credentials')
    fireEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(ServiceProviderService.verifyCredential).toHaveBeenCalledWith(
        mockIdentities[0].credentials[0],
        'test-verifier',
        'Test Verifier'
      )
    })
  })

  it('should switch to batch mode and use batch verification', async () => {
    const { ServiceProviderService } = require('../../services/serviceProviderService')
    
    render(<ServiceProvider identities={mockIdentities} />)
    
    // Switch to batch mode
    const batchModeRadio = screen.getByDisplayValue('batch')
    fireEvent.click(batchModeRadio)
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText('Verifier ID:'), {
      target: { value: 'test-verifier' }
    })
    fireEvent.change(screen.getByLabelText('Verifier Name:'), {
      target: { value: 'Test Verifier' }
    })
    
    // Select an identity
    const identityCheckbox = screen.getByRole('checkbox', { name: /Test Identity 1/ })
    fireEvent.click(identityCheckbox)
    
    // Click verify button
    const verifyButton = screen.getByText('✅ Verify Credentials')
    fireEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(ServiceProviderService.verifyCredentialsBatch).toHaveBeenCalledWith(
        mockIdentities[0].credentials,
        'test-verifier',
        'Test Verifier'
      )
    })
  })

  it('should disable verify button when no identities are selected', () => {
    render(<ServiceProvider identities={mockIdentities} />)
    
    const verifyButton = screen.getByText('✅ Verify Credentials')
    expect(verifyButton).toBeDisabled()
  })

  it('should disable create request button when required fields are missing', () => {
    render(<ServiceProvider identities={mockIdentities} />)
    
    // Clear the pre-filled fields to test the disabled state
    fireEvent.change(screen.getByLabelText('Verifier ID:'), {
      target: { value: '' }
    })
    
    const createButton = screen.getByText('📋 Create Presentation Request')
    expect(createButton).toBeDisabled()
  })

  it('should handle empty identities list', () => {
    render(<ServiceProvider identities={[]} />)
    
    expect(screen.getByText('No identities available for verification')).toBeInTheDocument()
  })

  it('should call onVerificationComplete callback when provided', async () => {
    const mockCallback = jest.fn()
    
    render(<ServiceProvider identities={mockIdentities} onVerificationComplete={mockCallback} />)
    
    // Fill in required fields and select identity
    fireEvent.change(screen.getByLabelText('Verifier ID:'), {
      target: { value: 'test-verifier' }
    })
    fireEvent.change(screen.getByLabelText('Verifier Name:'), {
      target: { value: 'Test Verifier' }
    })
    
    const identityCheckbox = screen.getByRole('checkbox', { name: /Test Identity 1/ })
    fireEvent.click(identityCheckbox)
    
    // Click verify button
    const verifyButton = screen.getByText('✅ Verify Credentials')
    fireEvent.click(verifyButton)
    
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          isValid: true,
          credentialId: 'cred-1'
        })
      )
    })
  })
})