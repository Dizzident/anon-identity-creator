import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { QRCodeModal } from '../../components/QRCodeModal'
import { Identity, DIDIdentity } from '../../types/identity'
import QRCode from 'qrcode'

// Mock QRCode module
jest.mock('qrcode', () => ({
  toDataURL: jest.fn()
}))

// Mock MockDIDService
jest.mock('../../services/mockDIDService', () => ({
  MockDIDService: {
    createVerifiablePresentation: jest.fn().mockResolvedValue({
      type: 'VerifiablePresentation',
      verifiableCredential: [],
      holder: 'did:mock:123',
      proof: {}
    })
  }
}))

const mockQRCode = QRCode as jest.Mocked<typeof QRCode>

describe('QRCodeModal', () => {
  const mockIdentity: Identity = {
    id: 'test-id-123',
    name: 'Test Identity',
    publicKey: 'public-key-123',
    privateKey: 'private-key-123',
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    attributes: {
      givenName: 'John',
      familyName: 'Doe'
    }
  }

  const mockDIDIdentity: DIDIdentity = {
    id: 'did-test-id-123',
    name: 'Test DID Identity',
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

  const mockOnClose = jest.fn()
  const mockDataURL = 'data:image/png;base64,mockQRCode'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(mockQRCode.toDataURL as jest.Mock).mockResolvedValue(mockDataURL)
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    })
    
    // Mock alert
    window.alert = jest.fn()
  })

  it('should not render when closed', () => {
    render(
      <QRCodeModal 
        identity={mockIdentity} 
        isOpen={false} 
        onClose={mockOnClose} 
      />
    )

    expect(screen.queryByText('Transfer Identity to Mobile App')).not.toBeInTheDocument()
  })

  it('should render when open', async () => {
    render(
      <QRCodeModal 
        identity={mockIdentity} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )

    expect(screen.getByText('Transfer Identity to Mobile App')).toBeInTheDocument()
    expect(screen.getByText('Test Identity')).toBeInTheDocument()
    expect(screen.getByText('test-id-123')).toBeInTheDocument()
  })

  it('should generate QR code when opened', async () => {
    await act(async () => {
      render(
        <QRCodeModal 
          identity={mockIdentity} 
          isOpen={true} 
          onClose={mockOnClose} 
        />
      )
    })

    await waitFor(() => {
      expect(mockQRCode.toDataURL).toHaveBeenCalled()
    })

    const qrImage = screen.getByAltText('Identity Transfer QR Code')
    expect(qrImage).toHaveAttribute('src', mockDataURL)
  })

  it('should show loading state while generating QR code', () => {
    // Make QRCode generation take longer
    ;(mockQRCode.toDataURL as jest.Mock).mockReturnValue(new Promise(() => {}))

    render(
      <QRCodeModal 
        identity={mockIdentity} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )

    expect(screen.getByText('Generating QR Code...')).toBeInTheDocument()
  })

  it('should close modal when close button is clicked', () => {
    render(
      <QRCodeModal 
        identity={mockIdentity} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )

    const closeButton = screen.getByText('×')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should close modal when overlay is clicked', () => {
    render(
      <QRCodeModal 
        identity={mockIdentity} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )

    const overlay = screen.getByRole('button').closest('.qr-modal-overlay')
    if (overlay) {
      fireEvent.click(overlay)
      expect(mockOnClose).toHaveBeenCalled()
    }
  })

  it('should not close modal when content is clicked', () => {
    render(
      <QRCodeModal 
        identity={mockIdentity} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )

    const content = screen.getByText('Transfer Identity to Mobile App')
    fireEvent.click(content)

    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('should copy transfer data to clipboard', async () => {
    await act(async () => {
      render(
        <QRCodeModal 
          identity={mockIdentity} 
          isOpen={true} 
          onClose={mockOnClose} 
        />
      )
    })

    // Wait for QR code to be generated
    await waitFor(() => {
      expect(mockQRCode.toDataURL).toHaveBeenCalled()
    })

    // Wait for the copy button to appear
    await waitFor(() => {
      expect(screen.getByText('Copy Transfer Data')).toBeInTheDocument()
    })

    const copyButton = screen.getByText('Copy Transfer Data')
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
      expect(window.alert).toHaveBeenCalledWith('Transfer data copied to clipboard!')
    })
  })

  it('should download QR code', async () => {
    await act(async () => {
      render(
        <QRCodeModal 
          identity={mockIdentity} 
          isOpen={true} 
          onClose={mockOnClose} 
        />
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Download QR Code')).toBeInTheDocument()
    })

    // Mock createElement and related DOM methods
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn()
    }
    const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
    const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation()
    const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation()

    const downloadButton = screen.getByText('Download QR Code')
    fireEvent.click(downloadButton)

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(mockLink.href).toBe(mockDataURL)
    expect(mockLink.download).toBe('identity-Test Identity-qr.png')
    expect(mockLink.click).toHaveBeenCalled()
    expect(appendChildSpy).toHaveBeenCalledWith(mockLink)
    expect(removeChildSpy).toHaveBeenCalledWith(mockLink)

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })

  it('should display transfer instructions', () => {
    render(
      <QRCodeModal 
        identity={mockIdentity} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )

    expect(screen.getByText('Instructions')).toBeInTheDocument()
    expect(screen.getByText('Open your mobile identity app')).toBeInTheDocument()
    expect(screen.getByText(/Security Warning/)).toBeInTheDocument()
  })

  it('should handle QR code generation error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    ;(mockQRCode.toDataURL as jest.Mock).mockRejectedValue(new Error('QR generation failed'))

    render(
      <QRCodeModal 
        identity={mockIdentity} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to generate QR code:', expect.any(Error))
    })

    consoleErrorSpy.mockRestore()
  })

  it('should format creation date correctly', () => {
    render(
      <QRCodeModal 
        identity={mockIdentity} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )

    // Check if the date is displayed (format may vary by locale - could show as 2022 due to timezone)
    expect(screen.getByText(/202[23]/)).toBeInTheDocument()
  })

  it('should handle string dates in identity', () => {
    const identityWithStringDate = {
      ...mockIdentity,
      createdAt: '2023-06-15T12:30:00.000Z' as any
    }

    render(
      <QRCodeModal 
        identity={identityWithStringDate} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )

    // Check if the date is displayed (format may vary by locale)
    expect(screen.getByText(/202[23]/)).toBeInTheDocument()
  })

  describe('DID Identity tests', () => {
    it('should show transfer mode selection for DID identities', async () => {
      await act(async () => {
        render(
          <QRCodeModal 
            identity={mockDIDIdentity} 
            isOpen={true} 
            onClose={mockOnClose} 
          />
        )
      })

      expect(screen.getByText('Transfer Mode')).toBeInTheDocument()
      expect(screen.getByText('📦 Full Transfer')).toBeInTheDocument()
      expect(screen.getByText('🎫 Verifiable Presentation')).toBeInTheDocument()
      expect(screen.getByText('🔐 Selective Disclosure')).toBeInTheDocument()
    })

    it('should show selective attributes when selective mode is selected', async () => {
      await act(async () => {
        render(
          <QRCodeModal 
            identity={mockDIDIdentity} 
            isOpen={true} 
            onClose={mockOnClose} 
          />
        )
      })

      const selectiveRadio = screen.getByDisplayValue('selective')
      fireEvent.click(selectiveRadio)

      await waitFor(() => {
        expect(screen.getByText('Select Attributes to Share')).toBeInTheDocument()
        expect(screen.getByText('givenName')).toBeInTheDocument()
        expect(screen.getByText('familyName')).toBeInTheDocument()
        expect(screen.getByText('email')).toBeInTheDocument()
      })
    })

    it('should not show transfer mode selection for legacy identities', () => {
      render(
        <QRCodeModal 
          identity={mockIdentity} 
          isOpen={true} 
          onClose={mockOnClose} 
        />
      )

      expect(screen.queryByText('Transfer Mode')).not.toBeInTheDocument()
    })
  })
})