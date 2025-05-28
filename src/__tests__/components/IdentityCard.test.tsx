import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IdentityCard from '../../components/IdentityCard'
import { Identity } from '../../types/identity'

describe('IdentityCard', () => {
  const mockIdentity: Identity = {
    id: 'test-id',
    name: 'Test Identity',
    publicKey: 'dGVzdC1wdWJsaWMta2V5LXRoYXQtaXMtbG9uZy1lbm91Z2gtdG8tYmUtdHJ1bmNhdGVk',
    privateKey: 'dGVzdC1wcml2YXRlLWtleQ==',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    attributes: {
      givenName: 'John',
      familyName: 'Doe',
      email: 'john.doe@example.com',
      isOver18: true
    }
  }
  const mockOnDelete = jest.fn()
  const mockWriteText = jest.fn(() => Promise.resolve())

  beforeEach(() => {
    jest.clearAllMocks()
    ;(navigator.clipboard.writeText as jest.Mock) = mockWriteText
  })

  it('renders identity information', () => {
    render(<IdentityCard identity={mockIdentity} onDelete={mockOnDelete} />)
    
    expect(screen.getByText('Test Identity')).toBeInTheDocument()
    expect(screen.getByText(/dGVzdC1wdWJsaWMta2V5LXRoYXQtaXMtbG9uZy1lbm91Z2gtdG/)).toBeInTheDocument()
    expect(screen.getByText('Public Key:')).toBeInTheDocument()
    expect(screen.getByText('Private Key:')).toBeInTheDocument()
    expect(screen.getByText('Created:')).toBeInTheDocument()
  })

  it('hides private key by default', () => {
    render(<IdentityCard identity={mockIdentity} onDelete={mockOnDelete} />)
    
    expect(screen.getByText(/••••••••/)).toBeInTheDocument()
    expect(screen.queryByText(mockIdentity.privateKey)).not.toBeInTheDocument()
  })

  it('toggles private key visibility', async () => {
    const user = userEvent.setup()
    render(<IdentityCard identity={mockIdentity} onDelete={mockOnDelete} />)
    
    const toggleButton = screen.getByRole('button', { name: '👁️' })
    
    await user.click(toggleButton)
    expect(screen.getByText(mockIdentity.privateKey)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '🙈' })).toBeInTheDocument()
    
    await user.click(screen.getByRole('button', { name: '🙈' }))
    expect(screen.queryByText(mockIdentity.privateKey)).not.toBeInTheDocument()
  })

  it('copies public key to clipboard', async () => {
    const user = userEvent.setup()
    render(<IdentityCard identity={mockIdentity} onDelete={mockOnDelete} />)
    
    const copyButtons = screen.getAllByRole('button', { name: '📋' })
    await user.click(copyButtons[0])
    
    expect(mockWriteText).toHaveBeenCalledWith(mockIdentity.publicKey)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '✓' })).toBeInTheDocument()
    })
    
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '✓' })).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('copies private key to clipboard when visible', async () => {
    const user = userEvent.setup()
    render(<IdentityCard identity={mockIdentity} onDelete={mockOnDelete} />)
    
    const toggleButton = screen.getByRole('button', { name: '👁️' })
    await user.click(toggleButton)
    
    const copyButtons = screen.getAllByRole('button', { name: '📋' })
    await user.click(copyButtons[1])
    
    expect(mockWriteText).toHaveBeenCalledWith(mockIdentity.privateKey)
  })

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    render(<IdentityCard identity={mockIdentity} onDelete={mockOnDelete} />)
    
    const deleteButton = screen.getByRole('button', { name: '×' })
    await user.click(deleteButton)
    
    expect(mockOnDelete).toHaveBeenCalledWith('test-id')
  })

  it('handles clipboard errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    mockWriteText.mockRejectedValueOnce(new Error('Clipboard error'))
    
    const user = userEvent.setup()
    render(<IdentityCard identity={mockIdentity} onDelete={mockOnDelete} />)
    
    const copyButtons = screen.getAllByRole('button', { name: '📋' })
    await user.click(copyButtons[0])
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to copy:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('displays and hides profile information', async () => {
    const user = userEvent.setup()
    render(<IdentityCard identity={mockIdentity} onDelete={mockOnDelete} />)
    
    // Profile information should be present
    expect(screen.getByText('Profile Information:')).toBeInTheDocument()
    
    // Initially attributes should be hidden
    expect(screen.queryByText('First Name:')).not.toBeInTheDocument()
    
    // Click to show attributes
    const toggleButton = screen.getByRole('button', { name: '🔽' })
    await user.click(toggleButton)
    
    // Now attributes should be visible
    expect(screen.getByText('First Name:')).toBeInTheDocument()
    expect(screen.getByText('John')).toBeInTheDocument()
    expect(screen.getByText('Last Name:')).toBeInTheDocument()
    expect(screen.getByText('Doe')).toBeInTheDocument()
    expect(screen.getByText('Email Address:')).toBeInTheDocument()
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument()
    expect(screen.getByText('Are you over 18?:')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    
    // Click to hide attributes
    const hideButton = screen.getByRole('button', { name: '🔼' })
    await user.click(hideButton)
    
    // Attributes should be hidden again
    expect(screen.queryByText('First Name:')).not.toBeInTheDocument()
  })

  it('formats different attribute types correctly', async () => {
    const identityWithDifferentTypes: Identity = {
      ...mockIdentity,
      attributes: {
        dateOfBirth: '1990-01-01',
        isOver18: false,
      }
    }
    
    const user = userEvent.setup()
    render(<IdentityCard identity={identityWithDifferentTypes} onDelete={mockOnDelete} />)
    
    // Should show the profile section with populated attributes
    expect(screen.getByText('Profile Information:')).toBeInTheDocument()
    
    // Click to show attributes
    const toggleButton = screen.getByRole('button', { name: '🔽' })
    await user.click(toggleButton)
    
    // Check that different types are formatted correctly
    expect(screen.getByText('12/31/1989')).toBeInTheDocument() // Date formatting
    expect(screen.getByText('No')).toBeInTheDocument() // Boolean formatting
  })

  it('handles identity without attributes', () => {
    const identityWithoutAttrs: Identity = {
      ...mockIdentity,
      attributes: {}
    }
    
    render(<IdentityCard identity={identityWithoutAttrs} onDelete={mockOnDelete} />)
    
    // Should not show profile information section
    expect(screen.queryByText('Profile Information:')).not.toBeInTheDocument()
  })
})