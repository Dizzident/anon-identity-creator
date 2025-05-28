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

  it('renders all schema fields correctly', () => {
    render(<IdentityCreator onIdentityCreated={mockOnIdentityCreated} />)
    
    // Check basic profile fields
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Date of Birth')).toBeInTheDocument()
    expect(screen.getByLabelText('Are you over 18?')).toBeInTheDocument()
    expect(screen.getByLabelText('Nationality')).toBeInTheDocument()
    expect(screen.getByLabelText('Occupation')).toBeInTheDocument()
    
    // Check contact info fields
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument()
    expect(screen.getByLabelText('Street Address')).toBeInTheDocument()
    expect(screen.getByLabelText('City')).toBeInTheDocument()
    expect(screen.getByLabelText('State/Province')).toBeInTheDocument()
    expect(screen.getByLabelText('Postal Code')).toBeInTheDocument()
    expect(screen.getByLabelText('Country')).toBeInTheDocument()
  })

  it('handles attribute changes and clears errors', async () => {
    const user = userEvent.setup()
    render(<IdentityCreator onIdentityCreated={mockOnIdentityCreated} />)
    
    const firstNameInput = screen.getByLabelText('First Name')
    const isOver18Checkbox = screen.getByLabelText('Are you over 18?')
    const dateInput = screen.getByLabelText('Date of Birth')
    
    // Fill in some attributes
    await user.type(firstNameInput, 'John')
    await user.click(isOver18Checkbox)
    await user.type(dateInput, '1990-01-01')
    
    expect(firstNameInput).toHaveValue('John')
    expect(isOver18Checkbox).toBeChecked()
    expect(dateInput).toHaveValue('1990-01-01')
  })

  it('creates identity with attributes', async () => {
    const user = userEvent.setup()
    render(<IdentityCreator onIdentityCreated={mockOnIdentityCreated} />)
    
    const nameInput = screen.getByLabelText('Identity Name *')
    const firstNameInput = screen.getByLabelText('First Name')
    const emailInput = screen.getByLabelText('Email Address')
    const isOver18Checkbox = screen.getByLabelText('Are you over 18?')
    const button = screen.getByRole('button', { name: 'Create Identity' })
    
    await user.type(nameInput, 'Test Identity')
    await user.type(firstNameInput, 'John')
    await user.type(emailInput, 'john@example.com')
    await user.click(isOver18Checkbox)
    await user.click(button)
    
    await waitFor(() => {
      expect(mockOnIdentityCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Identity',
          attributes: expect.objectContaining({
            givenName: 'John',
            email: 'john@example.com',
            isOver18: true
          })
        })
      )
    })
    
    // Form should be reset
    expect(nameInput).toHaveValue('')
    expect(firstNameInput).toHaveValue('')
    expect(emailInput).toHaveValue('')
    expect(isOver18Checkbox).not.toBeChecked()
  })

  it('resets form after successful creation', async () => {
    const user = userEvent.setup()
    render(<IdentityCreator onIdentityCreated={mockOnIdentityCreated} />)
    
    const nameInput = screen.getByLabelText('Identity Name *')
    const firstNameInput = screen.getByLabelText('First Name')
    const button = screen.getByRole('button', { name: 'Create Identity' })
    
    await user.type(nameInput, 'Test Identity')
    await user.type(firstNameInput, 'John')
    await user.click(button)
    
    await waitFor(() => {
      expect(nameInput).toHaveValue('')
      expect(firstNameInput).toHaveValue('')
    })
  })
})