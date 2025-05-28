import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IdentityCreator from '../../components/IdentityCreator'
import { CryptoService } from '../../utils/crypto'

jest.mock('../../utils/crypto', () => ({
  CryptoService: {
    generateKeyPair: jest.fn(),
  },
}))

describe('IdentityCreator', () => {
  const mockOnIdentityCreated = jest.fn()
  const mockKeyPair = {
    publicKey: new Uint8Array([1, 2, 3, 4, 5]),
    privateKey: new Uint8Array([6, 7, 8, 9, 10]),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(CryptoService.generateKeyPair as jest.Mock).mockResolvedValue(mockKeyPair)
  })

  it('renders the create identity form', () => {
    render(<IdentityCreator onIdentityCreated={mockOnIdentityCreated} />)
    
    expect(screen.getByText('Create New Identity')).toBeInTheDocument()
    expect(screen.getByLabelText('Identity Name *')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Identity' })).toBeInTheDocument()
  })

  it('creates an identity with a valid name', async () => {
    const user = userEvent.setup()
    render(<IdentityCreator onIdentityCreated={mockOnIdentityCreated} />)
    
    const input = screen.getByLabelText('Identity Name *')
    const button = screen.getByRole('button', { name: 'Create Identity' })
    
    await user.type(input, 'Test Identity')
    await user.click(button)
    
    await waitFor(() => {
      expect(mockOnIdentityCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Identity',
          publicKey: expect.any(String),
          privateKey: expect.any(String),
          id: expect.any(String),
          createdAt: expect.any(Date),
        })
      )
    })
    
    expect(input).toHaveValue('')
  })

  it('prevents submission with empty name due to HTML5 validation', async () => {
    const user = userEvent.setup()
    
    render(<IdentityCreator onIdentityCreated={mockOnIdentityCreated} />)
    
    const input = screen.getByLabelText('Identity Name *')
    const button = screen.getByRole('button', { name: 'Create Identity' })
    
    // HTML5 validation should prevent form submission with empty required field
    await user.click(button)
    
    // The form should not submit, so onIdentityCreated should not be called
    expect(mockOnIdentityCreated).not.toHaveBeenCalled()
    
    // Check that the input has the required attribute
    expect(input).toHaveAttribute('required')
  })

  it('disables form during identity creation', async () => {
    const user = userEvent.setup()
    render(<IdentityCreator onIdentityCreated={mockOnIdentityCreated} />)
    
    const input = screen.getByLabelText('Identity Name *')
    const button = screen.getByRole('button', { name: 'Create Identity' })
    
    await user.type(input, 'Test Identity')
    
    // Click and immediately check the loading state
    const clickPromise = user.click(button)
    
    // Wait for the button to show loading state
    await waitFor(() => {
      expect(button).toHaveTextContent('Creating...')
      expect(button).toBeDisabled()
      expect(input).toBeDisabled()
    })
    
    await clickPromise
    
    await waitFor(() => {
      expect(button).toHaveTextContent('Create Identity')
      expect(button).not.toBeDisabled()
      expect(input).not.toBeDisabled()
    })
  })

  it('handles errors during identity creation', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const user = userEvent.setup()
    
    ;(CryptoService.generateKeyPair as jest.Mock).mockRejectedValue(new Error('Test error'))
    
    render(<IdentityCreator onIdentityCreated={mockOnIdentityCreated} />)
    
    const input = screen.getByLabelText('Identity Name *')
    const button = screen.getByRole('button', { name: 'Create Identity' })
    
    await user.type(input, 'Test Identity')
    await user.click(button)
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to create identity. Please try again.')
      expect(consoleSpy).toHaveBeenCalledWith('Error creating identity:', expect.any(Error))
    })
    
    expect(mockOnIdentityCreated).not.toHaveBeenCalled()
    
    alertSpy.mockRestore()
    consoleSpy.mockRestore()
  })
})