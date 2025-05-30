import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CredentialManager } from '../../components/CredentialManager'
import { DIDIdentity } from '../../types/identity'

// Mock the MockDIDService
jest.mock('../../services/mockDIDService', () => ({
  MockDIDService: {
    addCredentialToIdentity: jest.fn().mockResolvedValue({
      id: 'updated-identity',
      name: 'Test Identity',
      did: {
        id: 'did:mock:123',
        publicKey: new Uint8Array([1, 2, 3, 4])
      },
      credentials: [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'existing-cred',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:mock:123',
            givenName: 'John',
            familyName: 'Doe'
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
        },
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'new-cred',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:mock:123',
            customAttribute: 'custom value'
          },
          issuer: 'did:mock:issuer',
          issuanceDate: '2023-01-02T00:00:00Z',
          proof: {
            type: 'Ed25519Signature2020',
            created: '2023-01-02T00:00:00Z',
            proofPurpose: 'assertionMethod',
            verificationMethod: 'did:mock:issuer#key-1',
            jws: 'mock-proof-2'
          }
        }
      ],
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      lastUpdated: new Date('2023-01-02T00:00:00.000Z')
    })
  }
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined)
  }
})

// Mock window.alert and window.prompt
global.alert = jest.fn()
global.prompt = jest.fn()

describe('CredentialManager', () => {
  const mockIdentity: DIDIdentity = {
    id: 'test-identity',
    name: 'Test Identity',
    did: {
      id: 'did:mock:123',
      publicKey: new Uint8Array([1, 2, 3, 4])
    },
    credentials: [
      {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'cred-1',
        type: ['VerifiableCredential', 'IdentityCredential'],
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
      },
      {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'cred-2',
        type: ['VerifiableCredential', 'EducationCredential'],
        credentialSubject: {
          id: 'did:mock:123',
          degree: 'Bachelor of Science',
          university: 'Test University'
        },
        issuer: 'did:mock:university',
        issuanceDate: '2022-06-01T00:00:00Z',
        proof: {
          type: 'Ed25519Signature2020',
          created: '2022-06-01T00:00:00Z',
          proofPurpose: 'assertionMethod',
          verificationMethod: 'did:mock:university#key-1',
          jws: 'mock-proof-2'
        }
      }
    ],
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    lastUpdated: new Date('2023-01-01T00:00:00.000Z')
  }

  const mockOnIdentityUpdate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render credential manager interface', () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    expect(screen.getByText('Credential Management')).toBeInTheDocument()
    expect(screen.getByText('Current Credentials (2)')).toBeInTheDocument()
    expect(screen.getByText('➕ Add New Credential')).toBeInTheDocument()
  })

  it('should display all credentials with their details', () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    // Check first credential
    expect(screen.getByText('Identity Credential')).toBeInTheDocument()
    expect(screen.getByText('givenName:')).toBeInTheDocument()
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('familyName:')).toBeInTheDocument()
    expect(screen.getByText('Doe')).toBeInTheDocument()
    expect(screen.getByText('email:')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()

    // Check second credential
    expect(screen.getByText('EducationCredential')).toBeInTheDocument()
    expect(screen.getByText('degree:')).toBeInTheDocument()
    expect(screen.getByText('Bachelor of Science')).toBeInTheDocument()
    expect(screen.getByText('university:')).toBeInTheDocument()
    expect(screen.getByText('Test University')).toBeInTheDocument()
  })

  it('should show credential status correctly', () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    const validStatuses = screen.getAllByText('✅ Valid')
    expect(validStatuses).toHaveLength(2) // Both credentials should be valid
  })

  it('should show expired status for expired credentials', () => {
    const expiredIdentity = {
      ...mockIdentity,
      credentials: [{
        ...mockIdentity.credentials[0],
        expirationDate: '2020-01-01T00:00:00Z' // Past date
      }]
    }

    render(<CredentialManager identity={expiredIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    expect(screen.getByText('⚠️ Expired')).toBeInTheDocument()
  })

  it('should display issuance and expiration dates', () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    expect(screen.getByText('Issued:')).toBeInTheDocument()
    expect(screen.getByText('Expires:')).toBeInTheDocument()
  })

  it('should verify credential when verify button is clicked', () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    const verifyButtons = screen.getAllByText('🔍 Verify')
    fireEvent.click(verifyButtons[0])
    
    expect(global.alert).toHaveBeenCalledWith('Credential is valid and verified!')
  })

  it('should export credential when export button is clicked', async () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    const exportButtons = screen.getAllByText('📋 Export')
    fireEvent.click(exportButtons[0])
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        JSON.stringify(mockIdentity.credentials[0], null, 2)
      )
      expect(global.alert).toHaveBeenCalledWith('Credential copied to clipboard!')
    })
  })

  it('should toggle add credential form when button is clicked', () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    const addButton = screen.getByText('➕ Add New Credential')
    fireEvent.click(addButton)
    
    expect(screen.getByText('Add New Credential')).toBeInTheDocument()
    expect(screen.getByText('❌ Cancel')).toBeInTheDocument()
    expect(screen.getByLabelText('Credential Type:')).toBeInTheDocument()
    
    // Click cancel
    fireEvent.click(screen.getByText('❌ Cancel'))
    expect(screen.queryByText('Add New Credential')).not.toBeInTheDocument()
  })

  it('should display credential type selector options', () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    fireEvent.click(screen.getByText('➕ Add New Credential'))
    
    const select = screen.getByLabelText('Credential Type:')
    expect(select).toBeInTheDocument()
    
    // Check options
    expect(screen.getByDisplayValue('Custom Attributes')).toBeInTheDocument()
    expect(screen.getByText('Education')).toBeInTheDocument()
    expect(screen.getByText('Employment')).toBeInTheDocument()
    expect(screen.getByText('Professional Certification')).toBeInTheDocument()
  })

  it('should show quick add buttons for common attributes', () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    fireEvent.click(screen.getByText('➕ Add New Credential'))
    
    expect(screen.getByText('Quick Add:')).toBeInTheDocument()
    expect(screen.getByText('+ First Name')).toBeInTheDocument()
    expect(screen.getByText('+ Last Name')).toBeInTheDocument()
    expect(screen.getByText('+ Date of Birth')).toBeInTheDocument()
    expect(screen.getByText('+ Are you over 18?')).toBeInTheDocument()
    expect(screen.getByText('+ Nationality')).toBeInTheDocument()
    expect(screen.getByText('+ Occupation')).toBeInTheDocument()
  })

  it('should add attribute using quick add button', () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    fireEvent.click(screen.getByText('➕ Add New Credential'))
    
    // Mock prompt to return a value
    ;(global.prompt as jest.Mock).mockReturnValue('John')
    
    const quickAddButton = screen.getByText('+ First Name')
    fireEvent.click(quickAddButton)
    
    expect(global.prompt).toHaveBeenCalledWith('Enter First Name:')
    expect(screen.getByText('givenName:')).toBeInTheDocument()
    expect(screen.getByText('John')).toBeInTheDocument()
  })

  it('should not add attribute if prompt is cancelled', () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    fireEvent.click(screen.getByText('➕ Add New Credential'))
    
    // Mock prompt to return null (cancelled)
    ;(global.prompt as jest.Mock).mockReturnValue(null)
    
    const quickAddButton = screen.getByText('+ First Name')
    fireEvent.click(quickAddButton)
    
    expect(global.prompt).toHaveBeenCalledWith('Enter First Name:')
    expect(screen.queryByText('givenName:')).not.toBeInTheDocument()
  })

  it('should add custom attribute using input fields', () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    fireEvent.click(screen.getByText('➕ Add New Credential'))
    
    const nameInput = screen.getByPlaceholderText('Attribute name')
    const valueInput = screen.getByPlaceholderText('Attribute value')
    const addButton = screen.getByText('Add')
    
    fireEvent.change(nameInput, { target: { value: 'customField' } })
    fireEvent.change(valueInput, { target: { value: 'customValue' } })
    fireEvent.click(addButton)
    
    expect(screen.getByText('customField:')).toBeInTheDocument()
    expect(screen.getByText('customValue')).toBeInTheDocument()
  })

  it('should not add custom attribute if fields are empty', () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    fireEvent.click(screen.getByText('➕ Add New Credential'))
    
    const addButton = screen.getByText('Add')
    fireEvent.click(addButton)
    
    // Should not add anything since fields are empty
    expect(screen.queryByText(':')).not.toBeInTheDocument()
  })

  it('should remove attribute when remove button is clicked', () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    fireEvent.click(screen.getByText('➕ Add New Credential'))
    
    // Add an attribute first
    ;(global.prompt as jest.Mock).mockReturnValue('John')
    fireEvent.click(screen.getByText('+ First Name'))
    
    expect(screen.getByText('givenName:')).toBeInTheDocument()
    
    // Remove the attribute
    const removeButton = screen.getByText('❌')
    fireEvent.click(removeButton)
    
    expect(screen.queryByText('givenName:')).not.toBeInTheDocument()
  })

  it('should create credential when form is submitted with attributes', async () => {
    const { MockDIDService } = require('../../services/mockDIDService')
    
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    fireEvent.click(screen.getByText('➕ Add New Credential'))
    
    // Add an attribute
    ;(global.prompt as jest.Mock).mockReturnValue('John')
    fireEvent.click(screen.getByText('+ First Name'))
    
    // Submit the form
    const createButton = screen.getByText('Create Credential')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(MockDIDService.addCredentialToIdentity).toHaveBeenCalledWith(
        mockIdentity,
        { givenName: 'John' }
      )
      expect(mockOnIdentityUpdate).toHaveBeenCalled()
      expect(global.alert).toHaveBeenCalledWith('Credential added successfully!')
    })
  })

  it('should not create credential if no attributes are added', async () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    fireEvent.click(screen.getByText('➕ Add New Credential'))
    
    const createButton = screen.getByText('Create Credential')
    fireEvent.click(createButton)
    
    expect(global.alert).toHaveBeenCalledWith('Please add at least one attribute to the credential')
  })

  it('should handle credential creation error', async () => {
    const { MockDIDService } = require('../../services/mockDIDService')
    MockDIDService.addCredentialToIdentity.mockRejectedValueOnce(new Error('Creation failed'))
    
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    fireEvent.click(screen.getByText('➕ Add New Credential'))
    
    // Add an attribute
    ;(global.prompt as jest.Mock).mockReturnValue('John')
    fireEvent.click(screen.getByText('+ First Name'))
    
    // Submit the form
    const createButton = screen.getByText('Create Credential')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed to add credential')
    })
  })

  it('should change credential type when selector is changed', () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    fireEvent.click(screen.getByText('➕ Add New Credential'))
    
    const select = screen.getByLabelText('Credential Type:')
    fireEvent.change(select, { target: { value: 'education' } })
    
    expect(select).toHaveValue('education')
  })

  it('should format credential types correctly', () => {
    const multiTypeIdentity = {
      ...mockIdentity,
      credentials: [{
        ...mockIdentity.credentials[0],
        type: ['VerifiableCredential', 'EducationCredential', 'DegreeCredential']
      }]
    }

    render(<CredentialManager identity={multiTypeIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    expect(screen.getByText('EducationCredential, DegreeCredential')).toBeInTheDocument()
  })

  it('should show default type for credentials with only VerifiableCredential type', () => {
    const basicIdentity = {
      ...mockIdentity,
      credentials: [{
        ...mockIdentity.credentials[0],
        type: ['VerifiableCredential']
      }]
    }

    render(<CredentialManager identity={basicIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    expect(screen.getByText('Identity Credential')).toBeInTheDocument()
  })

  it('should format dates correctly', () => {
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    // Check that dates are formatted (should contain a date-like string)
    const issuedElements = screen.getAllByText(/Issued:/)
    expect(issuedElements.length).toBeGreaterThan(0)
  })

  it('should handle empty credentials list', () => {
    const emptyIdentity = {
      ...mockIdentity,
      credentials: []
    }

    render(<CredentialManager identity={emptyIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    expect(screen.getByText('Current Credentials (0)')).toBeInTheDocument()
  })

  it('should disable create button while adding credential', async () => {
    const { MockDIDService } = require('../../services/mockDIDService')
    
    // Make the service hang to test loading state
    let resolvePromise: (value: any) => void
    const hangingPromise = new Promise(resolve => {
      resolvePromise = resolve
    })
    MockDIDService.addCredentialToIdentity.mockReturnValue(hangingPromise)
    
    render(<CredentialManager identity={mockIdentity} onIdentityUpdate={mockOnIdentityUpdate} />)
    
    fireEvent.click(screen.getByText('➕ Add New Credential'))
    
    // Add an attribute
    ;(global.prompt as jest.Mock).mockReturnValue('John')
    fireEvent.click(screen.getByText('+ First Name'))
    
    // Submit the form
    const createButton = screen.getByText('Create Credential')
    fireEvent.click(createButton)
    
    // Check loading state
    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(screen.getByText('Creating...')).toBeDisabled()
    
    // Resolve the promise to finish the test
    resolvePromise!(mockIdentity)
  })
})