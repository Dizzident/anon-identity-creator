import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionManager } from '../../components/SessionManager'
import { Session } from '../../types/serviceProvider'

// Mock the ServiceProviderService
jest.mock('../../services/serviceProviderService', () => ({
  ServiceProviderService: {
    createSession: jest.fn().mockReturnValue({
      id: 'session-123',
      userId: 'user-1',
      serviceProviderId: 'sp-1',
      serviceProviderName: 'Test Service Provider',
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      expiresAt: new Date('2023-01-01T01:00:00.000Z'),
      lastActivityAt: new Date('2023-01-01T00:00:00.000Z'),
      status: 'active',
      sharedCredentials: [],
      permissions: ['read_credentials'],
      metadata: {}
    }),
    getActiveSessions: jest.fn().mockReturnValue([]),
    terminateSession: jest.fn().mockReturnValue(true),
    updateSessionActivity: jest.fn().mockReturnValue(true)
  }
}))

describe('SessionManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock crypto.randomUUID
    Object.defineProperty(global, 'crypto', {
      value: {
        randomUUID: jest.fn().mockReturnValue('mock-uuid-123')
      }
    })
  })

  it('should render the session manager interface', () => {
    render(<SessionManager />)
    
    expect(screen.getByText('🔐 Session Manager')).toBeInTheDocument()
    expect(screen.getByText('Manage secure credential sharing sessions')).toBeInTheDocument()
    expect(screen.getByText('➕ Create New Session')).toBeInTheDocument()
    expect(screen.getByText('🔄 Refresh')).toBeInTheDocument()
  })

  it('should show session overview statistics', () => {
    render(<SessionManager />)
    
    expect(screen.getByText('📊 Session Overview')).toBeInTheDocument()
    expect(screen.getByText('Total Sessions')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Expiring Soon')).toBeInTheDocument()
    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  it('should toggle create session form when button is clicked', () => {
    render(<SessionManager />)
    
    // Initially form should not be visible
    expect(screen.queryByText('Create New Session')).not.toBeInTheDocument()
    
    // Click create session button
    const createButton = screen.getByText('➕ Create New Session')
    fireEvent.click(createButton)
    
    // Form should now be visible
    expect(screen.getByText('Create New Session')).toBeInTheDocument()
    expect(screen.getByLabelText('User ID:')).toBeInTheDocument()
    expect(screen.getByLabelText('Service Provider Name:')).toBeInTheDocument()
    expect(screen.getByLabelText('Duration (minutes):')).toBeInTheDocument()
  })

  it('should create a new session when form is submitted', async () => {
    const mockCallback = jest.fn()
    const { ServiceProviderService } = require('../../services/serviceProviderService')
    
    render(<SessionManager onSessionSelected={mockCallback} />)
    
    // Open create form
    fireEvent.click(screen.getByText('➕ Create New Session'))
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('User ID:'), {
      target: { value: 'test-user' }
    })
    fireEvent.change(screen.getByLabelText('Service Provider Name:'), {
      target: { value: 'Test Provider' }
    })
    fireEvent.change(screen.getByLabelText('Duration (minutes):'), {
      target: { value: '120' }
    })
    
    // Submit form
    const createButton = screen.getByText('Create Session')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(ServiceProviderService.createSession).toHaveBeenCalledWith(
        'test-user',
        'mock-uuid-123',
        'Test Provider',
        120
      )
    })
    
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'session-123',
          userId: 'user-1'
        })
      )
    })
  })

  it('should disable create button when required fields are missing', () => {
    render(<SessionManager />)
    
    // Open create form
    fireEvent.click(screen.getByText('➕ Create New Session'))
    
    const createButton = screen.getByText('Create Session')
    expect(createButton).toBeDisabled()
    
    // Fill only user ID
    fireEvent.change(screen.getByLabelText('User ID:'), {
      target: { value: 'test-user' }
    })
    
    expect(createButton).toBeDisabled()
    
    // Fill service provider name
    fireEvent.change(screen.getByLabelText('Service Provider Name:'), {
      target: { value: 'Test Provider' }
    })
    
    expect(createButton).not.toBeDisabled()
  })

  it('should display no sessions message when no sessions exist', () => {
    render(<SessionManager />)
    
    expect(screen.getByText('No active sessions found')).toBeInTheDocument()
    expect(screen.getByText('Create a new session to get started')).toBeInTheDocument()
  })

  it('should display sessions when they exist', () => {
    const mockSessions: Session[] = [
      {
        id: 'session-1',
        userId: 'user-1',
        serviceProviderId: 'sp-1',
        serviceProviderName: 'Test Provider',
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        expiresAt: new Date('2023-01-01T01:00:00.000Z'),
        lastActivityAt: new Date('2023-01-01T00:00:00.000Z'),
        status: 'active',
        sharedCredentials: ['cred-1'],
        permissions: ['read_credentials'],
        metadata: {}
      }
    ]
    
    const { ServiceProviderService } = require('../../services/serviceProviderService')
    ServiceProviderService.getActiveSessions.mockReturnValue(mockSessions)
    
    render(<SessionManager />)
    
    expect(screen.getByText('Test Provider')).toBeInTheDocument()
    expect(screen.getByText('user-1')).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
  })

  it('should update overview statistics based on session status', () => {
    const mockSessions: Session[] = [
      {
        id: 'session-1',
        userId: 'user-1',
        serviceProviderId: 'sp-1',
        serviceProviderName: 'Active Provider',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        lastActivityAt: new Date(),
        status: 'active',
        sharedCredentials: [],
        permissions: ['read_credentials'],
        metadata: {}
      },
      {
        id: 'session-2',
        userId: 'user-2',
        serviceProviderId: 'sp-2',
        serviceProviderName: 'Expiring Provider',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 300000), // 5 minutes from now
        lastActivityAt: new Date(),
        status: 'active',
        sharedCredentials: [],
        permissions: ['read_credentials'],
        metadata: {}
      }
    ]
    
    const { ServiceProviderService } = require('../../services/serviceProviderService')
    ServiceProviderService.getActiveSessions.mockReturnValue(mockSessions)
    
    render(<SessionManager />)
    
    // Should show total sessions count
    const totalSessions = screen.getByText('Total Sessions').previousElementSibling
    expect(totalSessions).toHaveTextContent('2')
  })

  it('should call onSessionSelected when a session is clicked', () => {
    const mockCallback = jest.fn()
    const mockSessions: Session[] = [
      {
        id: 'session-1',
        userId: 'user-1',
        serviceProviderId: 'sp-1',
        serviceProviderName: 'Test Provider',
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        expiresAt: new Date('2023-01-01T01:00:00.000Z'),
        lastActivityAt: new Date('2023-01-01T00:00:00.000Z'),
        status: 'active',
        sharedCredentials: [],
        permissions: ['read_credentials'],
        metadata: {}
      }
    ]
    
    const { ServiceProviderService } = require('../../services/serviceProviderService')
    ServiceProviderService.getActiveSessions.mockReturnValue(mockSessions)
    
    render(<SessionManager onSessionSelected={mockCallback} />)
    
    // Click on session card
    const sessionCard = screen.getByText('Test Provider').closest('.session-card')
    fireEvent.click(sessionCard!)
    
    expect(mockCallback).toHaveBeenCalledWith(mockSessions[0])
  })

  it('should terminate session when terminate button is clicked', async () => {
    const mockSessions: Session[] = [
      {
        id: 'session-1',
        userId: 'user-1',
        serviceProviderId: 'sp-1',
        serviceProviderName: 'Test Provider',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
        lastActivityAt: new Date(),
        status: 'active',
        sharedCredentials: [],
        permissions: ['read_credentials'],
        metadata: {}
      }
    ]
    
    const { ServiceProviderService } = require('../../services/serviceProviderService')
    ServiceProviderService.getActiveSessions.mockReturnValue(mockSessions)
    
    // Mock window.confirm
    window.confirm = jest.fn().mockReturnValue(true)
    
    render(<SessionManager />)
    
    // Click terminate button
    const terminateButton = screen.getByText('🛑 Terminate')
    fireEvent.click(terminateButton)
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to terminate this session?')
    expect(ServiceProviderService.terminateSession).toHaveBeenCalledWith('session-1')
  })

  it('should cancel session creation when cancel button is clicked', () => {
    render(<SessionManager />)
    
    // Open create form
    fireEvent.click(screen.getByText('➕ Create New Session'))
    expect(screen.getByText('Create New Session')).toBeInTheDocument()
    
    // Click cancel
    fireEvent.click(screen.getByText('Cancel'))
    
    // Form should be hidden
    expect(screen.queryByText('Create New Session')).not.toBeInTheDocument()
  })

  it('should refresh sessions when refresh button is clicked', () => {
    const { ServiceProviderService } = require('../../services/serviceProviderService')
    
    render(<SessionManager />)
    
    // Click refresh button
    fireEvent.click(screen.getByText('🔄 Refresh'))
    
    // Should call getActiveSessions again
    expect(ServiceProviderService.getActiveSessions).toHaveBeenCalled()
  })
})