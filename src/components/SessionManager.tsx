import { useState, useEffect } from 'react'
import { Session } from '../types/serviceProvider'
import { ServiceProviderService } from '../services/serviceProviderService'
import './SessionManager.css'

interface SessionManagerProps {
  onSessionSelected?: (session: Session) => void
}

export function SessionManager({ onSessionSelected }: SessionManagerProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [newSessionForm, setNewSessionForm] = useState({
    userId: '',
    serviceProviderName: '',
    durationMinutes: 60,
    permissions: ['read_credentials']
  })
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    loadSessions()
    // Auto-refresh sessions every 30 seconds
    const interval = setInterval(loadSessions, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadSessions = () => {
    const activeSessions = ServiceProviderService.getActiveSessions()
    setSessions(activeSessions)
  }

  const handleCreateSession = async () => {
    if (!newSessionForm.userId || !newSessionForm.serviceProviderName) {
      alert('Please fill in all required fields')
      return
    }

    setIsCreatingSession(true)
    try {
      const session = ServiceProviderService.createSession(
        newSessionForm.userId,
        crypto.randomUUID(), // Generate service provider ID
        newSessionForm.serviceProviderName,
        newSessionForm.durationMinutes
      )

      setSessions(prev => [session, ...prev])
      setNewSessionForm({
        userId: '',
        serviceProviderName: '',
        durationMinutes: 60,
        permissions: ['read_credentials']
      })
      setShowCreateForm(false)
      
      // Auto-select the new session
      setSelectedSession(session)
      onSessionSelected?.(session)
    } catch (error) {
      console.error('Failed to create session:', error)
      alert('Failed to create session')
    } finally {
      setIsCreatingSession(false)
    }
  }

  const handleTerminateSession = (sessionId: string) => {
    if (window.confirm('Are you sure you want to terminate this session?')) {
      const success = ServiceProviderService.terminateSession(sessionId)
      if (success) {
        loadSessions()
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null)
        }
      }
    }
  }

  const handleExtendSession = (session: Session) => {
    // For demo purposes, we'll create a new session with extended time
    const extendedSession = ServiceProviderService.createSession(
      session.userId,
      session.serviceProviderId,
      session.serviceProviderName,
      60 // Extend by 1 hour
    )
    
    // Terminate the old session
    ServiceProviderService.terminateSession(session.id)
    
    loadSessions()
    setSelectedSession(extendedSession)
    onSessionSelected?.(extendedSession)
  }

  const handleSessionSelect = (session: Session) => {
    setSelectedSession(session)
    onSessionSelected?.(session)
    
    // Update activity
    ServiceProviderService.updateSessionActivity(session.id)
    loadSessions()
  }

  const formatTimeRemaining = (expiresAt: Date): string => {
    const now = new Date()
    const remaining = expiresAt.getTime() - now.getTime()
    
    if (remaining <= 0) return 'Expired'
    
    const minutes = Math.floor(remaining / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const getSessionStatusColor = (session: Session): string => {
    const now = new Date()
    const timeRemaining = session.expiresAt.getTime() - now.getTime()
    const minutesRemaining = timeRemaining / (1000 * 60)
    
    if (session.status !== 'active') return 'terminated'
    if (minutesRemaining <= 0) return 'expired'
    if (minutesRemaining <= 10) return 'expiring'
    return 'active'
  }

  return (
    <div className="session-manager">
      <div className="session-manager-header">
        <h2>🔐 Session Manager</h2>
        <p>Manage secure credential sharing sessions</p>
      </div>

      <div className="session-actions">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="create-session-btn"
        >
          ➕ Create New Session
        </button>
        <button
          onClick={loadSessions}
          className="refresh-btn"
        >
          🔄 Refresh
        </button>
      </div>

      {showCreateForm && (
        <div className="create-session-form">
          <h3>Create New Session</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="userId">User ID:</label>
              <input
                id="userId"
                type="text"
                value={newSessionForm.userId}
                onChange={(e) => setNewSessionForm({ ...newSessionForm, userId: e.target.value })}
                placeholder="Enter user identifier"
              />
            </div>
            <div className="form-group">
              <label htmlFor="serviceProviderName">Service Provider Name:</label>
              <input
                id="serviceProviderName"
                type="text"
                value={newSessionForm.serviceProviderName}
                onChange={(e) => setNewSessionForm({ ...newSessionForm, serviceProviderName: e.target.value })}
                placeholder="Enter service provider name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="durationMinutes">Duration (minutes):</label>
              <select
                id="durationMinutes"
                value={newSessionForm.durationMinutes}
                onChange={(e) => setNewSessionForm({ ...newSessionForm, durationMinutes: parseInt(e.target.value) })}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={480}>8 hours</option>
                <option value={1440}>24 hours</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button
              onClick={handleCreateSession}
              disabled={isCreatingSession || !newSessionForm.userId || !newSessionForm.serviceProviderName}
              className="create-btn"
            >
              {isCreatingSession ? 'Creating...' : 'Create Session'}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="sessions-overview">
        <h3>📊 Session Overview</h3>
        <div className="overview-stats">
          <div className="stat-item">
            <span className="stat-number">{sessions.length}</span>
            <span className="stat-label">Total Sessions</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{sessions.filter(s => getSessionStatusColor(s) === 'active').length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{sessions.filter(s => getSessionStatusColor(s) === 'expiring').length}</span>
            <span className="stat-label">Expiring Soon</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{sessions.filter(s => getSessionStatusColor(s) === 'expired').length}</span>
            <span className="stat-label">Expired</span>
          </div>
        </div>
      </div>

      <div className="sessions-list">
        <h3>📋 Active Sessions</h3>
        {sessions.length === 0 ? (
          <div className="no-sessions">
            <p>No active sessions found</p>
            <p>Create a new session to get started</p>
          </div>
        ) : (
          <div className="sessions-grid">
            {sessions.map(session => (
              <div
                key={session.id}
                className={`session-card ${getSessionStatusColor(session)} ${selectedSession?.id === session.id ? 'selected' : ''}`}
                onClick={() => handleSessionSelect(session)}
              >
                <div className="session-header">
                  <h4>{session.serviceProviderName}</h4>
                  <span className={`status-indicator ${getSessionStatusColor(session)}`}>
                    {getSessionStatusColor(session).toUpperCase()}
                  </span>
                </div>
                
                <div className="session-details">
                  <p><strong>User:</strong> {session.userId}</p>
                  <p><strong>Created:</strong> {session.createdAt.toLocaleString()}</p>
                  <p><strong>Last Activity:</strong> {session.lastActivityAt.toLocaleString()}</p>
                  <p><strong>Time Remaining:</strong> {formatTimeRemaining(session.expiresAt)}</p>
                  <p><strong>Shared Credentials:</strong> {session.sharedCredentials.length}</p>
                </div>

                <div className="session-actions-card">
                  {getSessionStatusColor(session) === 'active' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExtendSession(session)
                        }}
                        className="extend-btn"
                        title="Extend session by 1 hour"
                      >
                        ⏰ Extend
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTerminateSession(session.id)
                        }}
                        className="terminate-btn"
                        title="Terminate session"
                      >
                        🛑 Terminate
                      </button>
                    </>
                  )}
                  {getSessionStatusColor(session) === 'expiring' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExtendSession(session)
                      }}
                      className="extend-btn urgent"
                      title="Extend expiring session"
                    >
                      ⚠️ Extend Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedSession && (
        <div className="session-details-panel">
          <h3>🔍 Session Details</h3>
          <div className="details-content">
            <div className="detail-section">
              <h4>Session Information</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Session ID:</label>
                  <span className="session-id">{selectedSession.id}</span>
                </div>
                <div className="detail-item">
                  <label>User ID:</label>
                  <span>{selectedSession.userId}</span>
                </div>
                <div className="detail-item">
                  <label>Service Provider:</label>
                  <span>{selectedSession.serviceProviderName}</span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span className={`status ${getSessionStatusColor(selectedSession)}`}>
                    {selectedSession.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Timing Information</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Created At:</label>
                  <span>{selectedSession.createdAt.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Expires At:</label>
                  <span>{selectedSession.expiresAt.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Last Activity:</label>
                  <span>{selectedSession.lastActivityAt.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Time Remaining:</label>
                  <span className={getSessionStatusColor(selectedSession) === 'expiring' ? 'urgent' : ''}>
                    {formatTimeRemaining(selectedSession.expiresAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Permissions & Access</h4>
              <div className="permissions-list">
                {selectedSession.permissions.map((permission, index) => (
                  <span key={index} className="permission-badge">
                    {permission}
                  </span>
                ))}
              </div>
            </div>

            {selectedSession.sharedCredentials.length > 0 && (
              <div className="detail-section">
                <h4>Shared Credentials</h4>
                <div className="credentials-list">
                  {selectedSession.sharedCredentials.map((credId, index) => (
                    <div key={index} className="credential-item">
                      <span className="credential-id">{credId}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(selectedSession.metadata).length > 0 && (
              <div className="detail-section">
                <h4>Metadata</h4>
                <div className="metadata-content">
                  <pre>{JSON.stringify(selectedSession.metadata, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}