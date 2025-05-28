import { render, screen } from '@testing-library/react'
import IdentityList from '../../components/IdentityList'
import { Identity } from '../../types/identity'

describe('IdentityList', () => {
  const mockOnDelete = jest.fn()
  
  const mockIdentities: Identity[] = [
    {
      id: '1',
      name: 'Identity 1',
      publicKey: 'publicKey1',
      privateKey: 'privateKey1',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'Identity 2',
      publicKey: 'publicKey2',
      privateKey: 'privateKey2',
      createdAt: new Date('2024-01-02'),
    },
  ]

  it('renders title', () => {
    render(<IdentityList identities={[]} onDelete={mockOnDelete} />)
    expect(screen.getByText('Your Identities')).toBeInTheDocument()
  })

  it('shows empty message when no identities exist', () => {
    render(<IdentityList identities={[]} onDelete={mockOnDelete} />)
    expect(screen.getByText('No identities created yet. Create one above!')).toBeInTheDocument()
  })

  it('renders all identity cards when identities exist', () => {
    render(<IdentityList identities={mockIdentities} onDelete={mockOnDelete} />)
    
    expect(screen.getByText('Identity 1')).toBeInTheDocument()
    expect(screen.getByText('Identity 2')).toBeInTheDocument()
    expect(screen.queryByText('No identities created yet. Create one above!')).not.toBeInTheDocument()
  })

  it('passes onDelete prop to identity cards', () => {
    render(<IdentityList identities={mockIdentities} onDelete={mockOnDelete} />)
    
    const deleteButtons = screen.getAllByRole('button', { name: '×' })
    expect(deleteButtons).toHaveLength(2)
  })
})