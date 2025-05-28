import { render, screen, fireEvent } from '@testing-library/react'
import { StorageConfig } from '../../components/StorageConfig'
import { StorageType } from '../../types/storage'

describe('StorageConfig', () => {
  const mockOnTypeChange = jest.fn()

  beforeEach(() => {
    mockOnTypeChange.mockClear()
  })

  it('should render with current storage type', () => {
    render(<StorageConfig currentType="memory" onTypeChange={mockOnTypeChange} />)
    
    expect(screen.getByText('Storage Configuration')).toBeInTheDocument()
    expect(screen.getByText('Current storage:')).toBeInTheDocument()
    expect(screen.getByText('memory')).toBeInTheDocument()
  })

  it('should display all storage options', () => {
    render(<StorageConfig currentType="memory" onTypeChange={mockOnTypeChange} />)
    
    expect(screen.getByText('Memory (No persistence)')).toBeInTheDocument()
    expect(screen.getByText('Data is lost on page refresh')).toBeInTheDocument()
    
    expect(screen.getByText('Local Storage')).toBeInTheDocument()
    expect(screen.getByText('Persists across browser sessions')).toBeInTheDocument()
    
    expect(screen.getByText('Session Storage')).toBeInTheDocument()
    expect(screen.getByText('Persists until tab is closed')).toBeInTheDocument()
  })

  it('should have correct radio button checked', () => {
    render(<StorageConfig currentType="localStorage" onTypeChange={mockOnTypeChange} />)
    
    const memoryRadio = screen.getByDisplayValue('memory') as HTMLInputElement
    const localStorageRadio = screen.getByDisplayValue('localStorage') as HTMLInputElement
    const sessionStorageRadio = screen.getByDisplayValue('sessionStorage') as HTMLInputElement
    
    expect(memoryRadio.checked).toBe(false)
    expect(localStorageRadio.checked).toBe(true)
    expect(sessionStorageRadio.checked).toBe(false)
  })

  it('should call onTypeChange when radio button is clicked', () => {
    render(<StorageConfig currentType="memory" onTypeChange={mockOnTypeChange} />)
    
    const localStorageRadio = screen.getByDisplayValue('localStorage')
    fireEvent.click(localStorageRadio)
    
    expect(mockOnTypeChange).toHaveBeenCalledWith('localStorage')
  })

  it('should update current storage display', () => {
    const { rerender } = render(<StorageConfig currentType="memory" onTypeChange={mockOnTypeChange} />)
    expect(screen.getByText('memory')).toBeInTheDocument()
    
    rerender(<StorageConfig currentType="sessionStorage" onTypeChange={mockOnTypeChange} />)
    expect(screen.getByText('sessionStorage')).toBeInTheDocument()
  })

  it('should handle all storage type changes', () => {
    const { rerender } = render(<StorageConfig currentType="memory" onTypeChange={mockOnTypeChange} />)
    
    // Test localStorage selection
    const localStorageRadio = screen.getByDisplayValue('localStorage')
    fireEvent.click(localStorageRadio)
    expect(mockOnTypeChange).toHaveBeenCalledWith('localStorage')
    
    // Test sessionStorage selection
    const sessionStorageRadio = screen.getByDisplayValue('sessionStorage')
    fireEvent.click(sessionStorageRadio)
    expect(mockOnTypeChange).toHaveBeenCalledWith('sessionStorage')
    
    // Test memory selection (when not already selected)
    rerender(<StorageConfig currentType="localStorage" onTypeChange={mockOnTypeChange} />)
    const memoryRadio = screen.getByDisplayValue('memory')
    fireEvent.click(memoryRadio)
    expect(mockOnTypeChange).toHaveBeenCalledWith('memory')
    
    expect(mockOnTypeChange).toHaveBeenCalledTimes(3)
  })
})