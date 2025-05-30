import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SelectiveDisclosure } from '../../components/SelectiveDisclosure'
import { DIDIdentity } from '../../types/identity'

// Mock the MockDIDService
jest.mock('../../services/mockDIDService', () => ({
  MockDIDService: {
    createVerifiablePresentation: jest.fn().mockResolvedValue({
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      id: 'presentation-123',
      type: ['VerifiablePresentation'],
      verifiableCredential: [
        {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          id: 'selective-cred-1',
          type: ['VerifiableCredential'],
          credentialSubject: {
            id: 'did:mock:123',
            givenName: 'John'
          },
          issuer: 'did:mock:issuer',
          issuanceDate: '2023-01-01T00:00:00Z',
          selectiveDisclosure: {
            originalCredentialId: 'cred-1',
            disclosedAttributes: ['givenName'],
            timestamp: '2023-01-01T00:00:00Z'
          }
        }
      ],
      holder: 'did:mock:123',
      proof: {
        type: 'Ed25519Signature2020',
        created: '2023-01-01T00:00:00Z',
        proofPurpose: 'authentication',
        verificationMethod: 'did:mock:123#key-1',
        jws: 'mock-proof'
      }
    })
  }
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined)
  }
})

// Mock window.alert
global.alert = jest.fn()

describe('SelectiveDisclosure', () => {
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
        type: ['VerifiableCredential'],
        credentialSubject: {
          id: 'did:mock:123',
          givenName: 'John',
          familyName: 'Doe',
          email: 'john@example.com',
          isOver18: true
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
        type: ['VerifiableCredential'],
        credentialSubject: {
          id: 'did:mock:123',
          degree: 'Bachelor of Science',
          university: 'Test University',
          graduationYear: 2020,
          gpa: null
        },
        issuer: 'did:mock:university',
        issuanceDate: '2020-06-01T00:00:00Z',
        proof: {
          type: 'Ed25519Signature2020',
          created: '2020-06-01T00:00:00Z',
          proofPurpose: 'assertionMethod',
          verificationMethod: 'did:mock:university#key-1',
          jws: 'mock-proof-2'
        }
      }
    ],
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    lastUpdated: new Date('2023-01-01T00:00:00.000Z')
  }

  const mockOnPresentationCreated = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render selective disclosure interface', () => {
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    expect(screen.getByText('Selective Disclosure')).toBeInTheDocument()
    expect(screen.getByText('Choose which attributes you want to share. Only selected information will be included in the presentation.')).toBeInTheDocument()
    expect(screen.getByText('Available Attributes')).toBeInTheDocument()
    expect(screen.getByText('Select All')).toBeInTheDocument()
  })

  it('should display all available attributes from credentials', () => {
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    // Check attributes from first credential
    expect(screen.getByText('Given Name')).toBeInTheDocument()
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('Family Name')).toBeInTheDocument()
    expect(screen.getByText('Doe')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Is Over18')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()

    // Check attributes from second credential
    expect(screen.getByText('Degree')).toBeInTheDocument()
    expect(screen.getByText('Bachelor of Science')).toBeInTheDocument()
    expect(screen.getByText('University')).toBeInTheDocument()
    expect(screen.getByText('Test University')).toBeInTheDocument()
    expect(screen.getByText('Graduation Year')).toBeInTheDocument()
    expect(screen.getByText('2020')).toBeInTheDocument()
    expect(screen.getByText('Gpa')).toBeInTheDocument()
    expect(screen.getByText('Not provided')).toBeInTheDocument()
  })

  it('should format attribute names correctly', () => {
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    expect(screen.getByText('Given Name')).toBeInTheDocument() // givenName -> Given Name
    expect(screen.getByText('Family Name')).toBeInTheDocument() // familyName -> Family Name
    expect(screen.getByText('Is Over18')).toBeInTheDocument() // isOver18 -> Is Over18
    expect(screen.getByText('Graduation Year')).toBeInTheDocument() // graduationYear -> Graduation Year
  })

  it('should format attribute values correctly', () => {
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    expect(screen.getByText('Yes')).toBeInTheDocument() // true -> Yes
    expect(screen.getByText('Not provided')).toBeInTheDocument() // null -> Not provided
    expect(screen.getByText('2020')).toBeInTheDocument() // number -> string
  })

  it('should allow individual attribute selection', () => {
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(8) // 7 attributes + select all button
    
    // Initially no checkboxes should be checked
    checkboxes.forEach(checkbox => {
      expect(checkbox).not.toBeChecked()
    })
    
    // Select first attribute (Given Name)
    fireEvent.click(checkboxes[1]) // Skip select all checkbox
    expect(checkboxes[1]).toBeChecked()
    
    // Select count should update
    expect(screen.getByText('1 of 7 attributes selected')).toBeInTheDocument()
  })

  it('should handle select all functionality', () => {
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    const selectAllButton = screen.getByText('Select All')
    fireEvent.click(selectAllButton)
    
    // All checkboxes should be checked
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.slice(1).forEach(checkbox => { // Skip select all checkbox
      expect(checkbox).toBeChecked()
    })
    
    expect(screen.getByText('7 of 7 attributes selected')).toBeInTheDocument()
    expect(screen.getByText('Deselect All')).toBeInTheDocument()
    
    // Click deselect all
    fireEvent.click(screen.getByText('Deselect All'))
    
    checkboxes.slice(1).forEach(checkbox => {
      expect(checkbox).not.toBeChecked()
    })
    
    expect(screen.getByText('0 of 7 attributes selected')).toBeInTheDocument()
    expect(screen.getByText('Select All')).toBeInTheDocument()
  })

  it('should disable create presentation button when no attributes selected', () => {
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    const createButton = screen.getByText('Create Presentation')
    expect(createButton).toBeDisabled()
  })

  it('should enable create presentation button when attributes are selected', () => {
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    // Select an attribute
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])
    
    const createButton = screen.getByText('Create Presentation')
    expect(createButton).not.toBeDisabled()
  })

  it('should create selective presentation when button clicked', async () => {
    const { MockDIDService } = require('../../services/mockDIDService')
    
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    // Select a few attributes
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // givenName
    fireEvent.click(checkboxes[3]) // email
    
    const createButton = screen.getByText('Create Presentation')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(MockDIDService.createVerifiablePresentation).toHaveBeenCalled()
      expect(mockOnPresentationCreated).toHaveBeenCalled()
      expect(screen.getByText('Verifiable Presentation Created')).toBeInTheDocument()
    })
  })

  it('should show error when trying to create presentation with no attributes', async () => {
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    // Force enable the button by selecting and then deselecting
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])
    fireEvent.click(checkboxes[1]) // Deselect
    
    // Try to create presentation directly (bypass disabled button)
    const component = screen.getByText('Create Presentation').closest('.selective-disclosure')
    const createPresentationSpy = jest.spyOn(require('../../components/SelectiveDisclosure').SelectiveDisclosure.prototype, 'createSelectivePresentation')
    
    // Manually trigger the function
    fireEvent.click(screen.getByText('Create Presentation'))
    
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Please select at least one attribute to disclose')
    })
  })

  it('should show loading state while creating presentation', async () => {
    const { MockDIDService } = require('../../services/mockDIDService')
    
    // Make the service hang to test loading state
    let resolvePromise: (value: any) => void
    const hangingPromise = new Promise(resolve => {
      resolvePromise = resolve
    })
    MockDIDService.createVerifiablePresentation.mockReturnValue(hangingPromise)
    
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    // Select an attribute
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])
    
    const createButton = screen.getByText('Create Presentation')
    fireEvent.click(createButton)
    
    // Check loading state
    expect(screen.getByText('Creating...')).toBeInTheDocument()
    expect(screen.getByText('Creating...')).toBeDisabled()
    
    // Resolve the promise to finish the test
    resolvePromise!({
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      id: 'presentation-123',
      type: ['VerifiablePresentation'],
      verifiableCredential: [],
      holder: 'did:mock:123'
    })
  })

  it('should display presentation details when created', async () => {
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    // Select attributes
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // givenName
    fireEvent.click(checkboxes[3]) // email
    
    const createButton = screen.getByText('Create Presentation')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Verifiable Presentation Created')).toBeInTheDocument()
      expect(screen.getByText('Type:')).toBeInTheDocument()
      expect(screen.getByText('Selective Disclosure Presentation')).toBeInTheDocument()
      expect(screen.getByText('Attributes Disclosed:')).toBeInTheDocument()
      expect(screen.getByText('Credentials Included:')).toBeInTheDocument()
      expect(screen.getByText('Disclosed Information:')).toBeInTheDocument()
    })
  })

  it('should copy presentation to clipboard when copy button clicked', async () => {
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    // Create presentation first
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])
    
    const createButton = screen.getByText('Create Presentation')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Copy Presentation')).toBeInTheDocument()
    })
    
    const copyButton = screen.getByText('Copy Presentation')
    fireEvent.click(copyButton)
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
      expect(global.alert).toHaveBeenCalledWith('Presentation copied to clipboard!')
    })
  })

  it('should handle presentation creation error', async () => {
    const { MockDIDService } = require('../../services/mockDIDService')
    MockDIDService.createVerifiablePresentation.mockRejectedValueOnce(new Error('Creation failed'))
    
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    // Select an attribute
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])
    
    const createButton = screen.getByText('Create Presentation')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed to create presentation')
    })
  })

  it('should handle identity with no credentials', () => {
    const emptyIdentity = {
      ...mockIdentity,
      credentials: []
    }

    render(<SelectiveDisclosure identity={emptyIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    expect(screen.getByText('No attributes available for disclosure')).toBeInTheDocument()
    expect(screen.getByText('0 of 0 attributes selected')).toBeInTheDocument()
  })

  it('should handle attributes with complex object values', () => {
    const complexIdentity = {
      ...mockIdentity,
      credentials: [{
        ...mockIdentity.credentials[0],
        credentialSubject: {
          id: 'did:mock:123',
          address: {
            street: '123 Main St',
            city: 'Anytown',
            country: 'USA'
          }
        }
      }]
    }

    render(<SelectiveDisclosure identity={complexIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    expect(screen.getByText('Address')).toBeInTheDocument()
    expect(screen.getByText('{"street":"123 Main St","city":"Anytown","country":"USA"}')).toBeInTheDocument()
  })

  it('should filter out credentials with no selected attributes', async () => {
    const { MockDIDService } = require('../../services/mockDIDService')
    
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    // Select only attributes from first credential
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // givenName from first credential
    
    const createButton = screen.getByText('Create Presentation')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      const mockCall = MockDIDService.createVerifiablePresentation.mock.calls[0]
      const identityArg = mockCall[0]
      
      // Should only include credentials with selected attributes
      expect(identityArg.credentials).toHaveLength(1)
      expect(identityArg.credentials[0].credentialSubject.givenName).toBe('John')
      expect(identityArg.credentials[0].selectiveDisclosure).toBeDefined()
    })
  })

  it('should include selective disclosure metadata in credentials', async () => {
    const { MockDIDService } = require('../../services/mockDIDService')
    
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    // Select an attribute
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]) // givenName
    
    const createButton = screen.getByText('Create Presentation')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      const mockCall = MockDIDService.createVerifiablePresentation.mock.calls[0]
      const identityArg = mockCall[0]
      const credential = identityArg.credentials[0]
      
      expect(credential.selectiveDisclosure).toEqual({
        originalCredentialId: 'cred-1',
        disclosedAttributes: ['givenName'],
        timestamp: expect.any(String)
      })
    })
  })

  it('should not call onPresentationCreated if not provided', async () => {
    render(<SelectiveDisclosure identity={mockIdentity} />)
    
    // Select an attribute
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])
    
    const createButton = screen.getByText('Create Presentation')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Verifiable Presentation Created')).toBeInTheDocument()
      // Should not throw error for missing callback
    })
  })

  it('should update selection count correctly', () => {
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    expect(screen.getByText('0 of 7 attributes selected')).toBeInTheDocument()
    
    // Select one attribute
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])
    expect(screen.getByText('1 of 7 attributes selected')).toBeInTheDocument()
    
    // Select another
    fireEvent.click(checkboxes[2])
    expect(screen.getByText('2 of 7 attributes selected')).toBeInTheDocument()
    
    // Deselect one
    fireEvent.click(checkboxes[1])
    expect(screen.getByText('1 of 7 attributes selected')).toBeInTheDocument()
  })

  it('should close presentation when close button is clicked', async () => {
    render(<SelectiveDisclosure identity={mockIdentity} onPresentationCreated={mockOnPresentationCreated} />)
    
    // Create presentation
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])
    
    const createButton = screen.getByText('Create Presentation')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Verifiable Presentation Created')).toBeInTheDocument()
    })
    
    // Find and click close button (assuming it exists based on component structure)
    const closeButton = screen.getByText('Close')
    fireEvent.click(closeButton)
    
    expect(screen.queryByText('Verifiable Presentation Created')).not.toBeInTheDocument()
  })
})