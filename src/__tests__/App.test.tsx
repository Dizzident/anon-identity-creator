import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { CryptoService } from '../utils/crypto'

jest.mock('../utils/crypto', () => ({
  CryptoService: {
    generateKeyPair: jest.fn(),
  },
}))

describe('App', () => {
  const mockKeyPair = {
    publicKey: new Uint8Array([1, 2, 3, 4, 5]),
    privateKey: new Uint8Array([6, 7, 8, 9, 10]),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(CryptoService.generateKeyPair as jest.Mock).mockResolvedValue(mockKeyPair)
  })

  it('renders app header and main components', () => {
    render(<App />)
    
    expect(screen.getByText('Anonymous Identity Manager')).toBeInTheDocument()
    expect(screen.getByText('Create New Identity')).toBeInTheDocument()
    expect(screen.getByText('Your Identities')).toBeInTheDocument()
  })

  it('creates and displays a new identity', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const input = screen.getByLabelText('Identity Name *')
    const createButton = screen.getByRole('button', { name: 'Create Identity' })
    
    await user.type(input, 'Test Identity')
    await user.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Test Identity')).toBeInTheDocument()
    })
    
    expect(screen.queryByText('No identities created yet. Create one above!')).not.toBeInTheDocument()
  })

  it('deletes an identity', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Create an identity first
    const input = screen.getByLabelText('Identity Name *')
    const createButton = screen.getByRole('button', { name: 'Create Identity' })
    
    await user.type(input, 'Test Identity')
    await user.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Test Identity')).toBeInTheDocument()
    })
    
    // Delete the identity
    const deleteButton = screen.getByRole('button', { name: '×' })
    await user.click(deleteButton)
    
    expect(screen.queryByText('Test Identity')).not.toBeInTheDocument()
    expect(screen.getByText('No identities created yet. Create one above!')).toBeInTheDocument()
  })

  it('creates multiple identities', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const input = screen.getByLabelText('Identity Name *')
    const createButton = screen.getByRole('button', { name: 'Create Identity' })
    
    // Create first identity
    await user.type(input, 'Identity 1')
    await user.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Identity 1')).toBeInTheDocument()
    })
    
    // Create second identity
    await user.type(input, 'Identity 2')
    await user.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Identity 2')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Identity 1')).toBeInTheDocument()
    expect(screen.getByText('Identity 2')).toBeInTheDocument()
  })
})