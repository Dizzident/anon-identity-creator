import { useState, useEffect } from 'react'
import { DIDIdentity } from '../types/identity'
import { 
  VerificationResult, 
  BatchVerificationResult, 
  PresentationRequest,
  VerificationRequestData 
} from '../types/serviceProvider'
import { ServiceProviderService } from '../services/serviceProviderService'
import './ServiceProvider.css'

interface ServiceProviderProps {
  identities: DIDIdentity[]
  onVerificationComplete?: (result: VerificationResult | BatchVerificationResult) => void
}

export function ServiceProvider({ identities, onVerificationComplete }: ServiceProviderProps) {
  const [selectedIdentities, setSelectedIdentities] = useState<string[]>([])
  const [verificationMode, setVerificationMode] = useState<'single' | 'batch'>('single')
  const [requestData, setRequestData] = useState<Partial<VerificationRequestData>>({
    verifierId: 'demo-verifier-001',
    verifierName: 'Demo Service Provider',
    purpose: 'Identity verification for service access',
    expiresIn: 60
  })
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResults, setVerificationResults] = useState<(VerificationResult | BatchVerificationResult)[]>([])
  const [presentationRequest, setPresentationRequest] = useState<PresentationRequest | null>(null)
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([])
  const [verificationHistory, setVerificationHistory] = useState<VerificationResult[]>([])

  useEffect(() => {
    // Load verification history
    if (requestData.verifierId) {
      const history = ServiceProviderService.getVerificationHistory(requestData.verifierId)
      setVerificationHistory(history)
    }
  }, [requestData.verifierId])

  const getAvailableAttributes = (): string[] => {
    if (selectedIdentities.length === 0) return []
    
    const attributes = new Set<string>()
    selectedIdentities.forEach(identityId => {
      const identity = identities.find(id => id.id === identityId)
      if (identity) {
        identity.credentials.forEach(credential => {
          Object.keys(credential.credentialSubject).forEach(key => {
            if (key !== 'id') {
              attributes.add(key)
            }
          })
        })
      }
    })
    
    return Array.from(attributes)
  }

  const handleCreatePresentationRequest = async () => {
    if (!requestData.verifierId || !requestData.verifierName || !requestData.purpose) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const request = await ServiceProviderService.createPresentationRequest({
        verifierId: requestData.verifierId,
        verifierName: requestData.verifierName,
        purpose: requestData.purpose,
        expiresIn: requestData.expiresIn || 60,
        presentationType: verificationMode,
        requestedAttributes: selectedAttributes.length > 0 ? selectedAttributes : undefined
      })
      
      setPresentationRequest(request)
    } catch (error) {
      console.error('Failed to create presentation request:', error)
      alert('Failed to create presentation request')
    }
  }

  const handleVerifyCredentials = async () => {
    if (selectedIdentities.length === 0) {
      alert('Please select at least one identity to verify')
      return
    }

    if (!requestData.verifierId || !requestData.verifierName) {
      alert('Please provide verifier details')
      return
    }

    setIsVerifying(true)
    
    try {
      let result: VerificationResult | BatchVerificationResult

      if (verificationMode === 'single' && selectedIdentities.length === 1) {
        // Single credential verification
        const identity = identities.find(id => id.id === selectedIdentities[0])
        if (identity && identity.credentials.length > 0) {
          result = await ServiceProviderService.verifyCredential(
            identity.credentials[0],
            requestData.verifierId!,
            requestData.verifierName!
          )
        } else {
          throw new Error('No credentials found for selected identity')
        }
      } else {
        // Batch verification
        const allCredentials = selectedIdentities.flatMap(identityId => {
          const identity = identities.find(id => id.id === identityId)
          return identity ? identity.credentials : []
        })

        result = await ServiceProviderService.verifyCredentialsBatch(
          allCredentials,
          requestData.verifierId!,
          requestData.verifierName!
        )
      }

      setVerificationResults(prev => [result, ...prev])
      onVerificationComplete?.(result)

      // Update verification history
      const history = ServiceProviderService.getVerificationHistory(requestData.verifierId!)
      setVerificationHistory(history)

    } catch (error) {
      console.error('Verification failed:', error)
      alert(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleVerifyPresentation = async (presentationData: string) => {
    if (!requestData.verifierId || !requestData.verifierName) {
      alert('Please provide verifier details')
      return
    }

    setIsVerifying(true)

    try {
      const presentation = JSON.parse(presentationData)
      const result = await ServiceProviderService.verifyPresentation(
        presentation,
        requestData.verifierId!,
        requestData.verifierName!
      )

      setVerificationResults(prev => [result, ...prev])
      onVerificationComplete?.(result)

      // Update verification history
      const history = ServiceProviderService.getVerificationHistory(requestData.verifierId!)
      setVerificationHistory(history)

    } catch (error) {
      console.error('Presentation verification failed:', error)
      alert(`Presentation verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsVerifying(false)
    }
  }

  const formatVerificationResult = (result: VerificationResult | BatchVerificationResult) => {
    if ('overallResult' in result) {
      // Batch result
      return (
        <div className={`verification-result ${result.overallResult}`}>
          <div className="result-header">
            <h4>Batch Verification Result</h4>
            <span className={`status-badge ${result.overallResult}`}>
              {result.overallResult.toUpperCase()}
            </span>
          </div>
          <div className="result-summary">
            <p><strong>Total Credentials:</strong> {result.totalCredentials}</p>
            <p><strong>Valid:</strong> {result.validCredentials}</p>
            <p><strong>Invalid:</strong> {result.invalidCredentials}</p>
            <p><strong>Processing Time:</strong> {result.processingTimeMs}ms</p>
            <p><strong>Processed At:</strong> {result.processedAt.toLocaleString()}</p>
          </div>
          <details className="individual-results">
            <summary>Individual Results ({result.results.length})</summary>
            {result.results.map((r, i) => (
              <div key={i} className={`individual-result ${r.isValid ? 'valid' : 'invalid'}`}>
                <p><strong>Credential:</strong> {r.credentialId}</p>
                <p><strong>Subject:</strong> {r.subject}</p>
                <p><strong>Valid:</strong> {r.isValid ? 'Yes' : 'No'}</p>
                {r.errors && r.errors.length > 0 && (
                  <p><strong>Errors:</strong> {r.errors.join(', ')}</p>
                )}
              </div>
            ))}
          </details>
        </div>
      )
    } else {
      // Single result
      return (
        <div className={`verification-result ${result.isValid ? 'valid' : 'invalid'}`}>
          <div className="result-header">
            <h4>Verification Result</h4>
            <span className={`status-badge ${result.isValid ? 'valid' : 'invalid'}`}>
              {result.isValid ? 'VALID' : 'INVALID'}
            </span>
          </div>
          <div className="result-details">
            <p><strong>Credential ID:</strong> {result.credentialId}</p>
            <p><strong>Subject:</strong> {result.subject}</p>
            <p><strong>Issuer:</strong> {result.issuer}</p>
            <p><strong>Verified At:</strong> {result.verifiedAt.toLocaleString()}</p>
            <p><strong>Verifier:</strong> {result.verifierName}</p>
          </div>
          <div className="verification-metadata">
            <h5>Verification Details:</h5>
            <ul>
              <li>Signature Valid: {result.metadata.signatureValid ? '✅' : '❌'}</li>
              <li>Not Expired: {result.metadata.notExpired ? '✅' : '❌'}</li>
              <li>Issuer Trusted: {result.metadata.issuerTrusted ? '✅' : '❌'}</li>
              <li>Revocation Checked: {result.metadata.revocationChecked ? '✅' : '❌'}</li>
            </ul>
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className="verification-errors">
              <h5>Errors:</h5>
              <ul>
                {result.errors.map((error, i) => (
                  <li key={i} className="error">{error}</li>
                ))}
              </ul>
            </div>
          )}
          {result.warnings && result.warnings.length > 0 && (
            <div className="verification-warnings">
              <h5>Warnings:</h5>
              <ul>
                {result.warnings.map((warning, i) => (
                  <li key={i} className="warning">{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )
    }
  }

  return (
    <div className="service-provider">
      <div className="service-provider-header">
        <h2>🏢 Service Provider Interface</h2>
        <p>Verify credentials and manage verification sessions</p>
      </div>

      <div className="verification-config">
        <h3>Verification Configuration</h3>
        
        <div className="config-section">
          <h4>Verifier Details</h4>
          <div className="form-group">
            <label htmlFor="verifierId">Verifier ID:</label>
            <input
              id="verifierId"
              type="text"
              value={requestData.verifierId || ''}
              onChange={(e) => setRequestData({ ...requestData, verifierId: e.target.value })}
              placeholder="Enter verifier ID"
            />
          </div>
          <div className="form-group">
            <label htmlFor="verifierName">Verifier Name:</label>
            <input
              id="verifierName"
              type="text"
              value={requestData.verifierName || ''}
              onChange={(e) => setRequestData({ ...requestData, verifierName: e.target.value })}
              placeholder="Enter verifier name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="purpose">Verification Purpose:</label>
            <textarea
              id="purpose"
              value={requestData.purpose || ''}
              onChange={(e) => setRequestData({ ...requestData, purpose: e.target.value })}
              placeholder="Describe the purpose of verification"
              rows={3}
            />
          </div>
        </div>

        <div className="config-section">
          <h4>Verification Mode</h4>
          <div className="verification-mode-options">
            <label className={`mode-option ${verificationMode === 'single' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="verificationMode"
                value="single"
                checked={verificationMode === 'single'}
                onChange={() => setVerificationMode('single')}
              />
              <div className="mode-info">
                <strong>🔍 Single Verification</strong>
                <small>Verify one credential at a time</small>
              </div>
            </label>
            <label className={`mode-option ${verificationMode === 'batch' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="verificationMode"
                value="batch"
                checked={verificationMode === 'batch'}
                onChange={() => setVerificationMode('batch')}
              />
              <div className="mode-info">
                <strong>📊 Batch Verification</strong>
                <small>Verify multiple credentials simultaneously</small>
              </div>
            </label>
          </div>
        </div>

        <div className="config-section">
          <h4>Select Identities to Verify</h4>
          {identities.length === 0 ? (
            <p className="no-identities">No identities available for verification</p>
          ) : (
            <div className="identity-selection">
              {identities.map(identity => (
                <label key={identity.id} className="identity-option">
                  <input
                    type="checkbox"
                    checked={selectedIdentities.includes(identity.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (verificationMode === 'single') {
                          setSelectedIdentities([identity.id])
                        } else {
                          setSelectedIdentities([...selectedIdentities, identity.id])
                        }
                      } else {
                        setSelectedIdentities(selectedIdentities.filter(id => id !== identity.id))
                      }
                    }}
                  />
                  <div className="identity-info">
                    <strong>{identity.name}</strong>
                    <small>{identity.credentials.length} credential(s)</small>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {selectedIdentities.length > 0 && (
          <div className="config-section">
            <h4>Available Attributes</h4>
            <div className="attributes-grid">
              {getAvailableAttributes().map(attr => (
                <label key={attr} className="attribute-option">
                  <input
                    type="checkbox"
                    checked={selectedAttributes.includes(attr)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAttributes([...selectedAttributes, attr])
                      } else {
                        setSelectedAttributes(selectedAttributes.filter(a => a !== attr))
                      }
                    }}
                  />
                  <span>{attr}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="verification-actions">
        <button
          onClick={handleCreatePresentationRequest}
          className="create-request-btn"
          disabled={!requestData.verifierId || !requestData.verifierName || !requestData.purpose}
        >
          📋 Create Presentation Request
        </button>
        
        <button
          onClick={handleVerifyCredentials}
          className="verify-btn"
          disabled={selectedIdentities.length === 0 || isVerifying || !requestData.verifierId || !requestData.verifierName}
        >
          {isVerifying ? '⏳ Verifying...' : '✅ Verify Credentials'}
        </button>
      </div>

      {presentationRequest && (
        <div className="presentation-request">
          <h3>📋 Presentation Request Created</h3>
          <div className="request-details">
            <p><strong>Request ID:</strong> {presentationRequest.id}</p>
            <p><strong>Purpose:</strong> {presentationRequest.purpose}</p>
            <p><strong>Expires At:</strong> {presentationRequest.expiresAt.toLocaleString()}</p>
            <p><strong>Status:</strong> {presentationRequest.status}</p>
            {presentationRequest.requestedAttributes.length > 0 && (
              <p><strong>Requested Attributes:</strong> {presentationRequest.requestedAttributes.join(', ')}</p>
            )}
          </div>
          
          <div className="manual-verification">
            <h4>Manual Presentation Verification</h4>
            <textarea
              placeholder="Paste presentation JSON here for verification"
              rows={4}
              id="presentationInput"
            />
            <button
              onClick={() => {
                const input = document.getElementById('presentationInput') as HTMLTextAreaElement
                if (input.value.trim()) {
                  handleVerifyPresentation(input.value)
                  input.value = ''
                }
              }}
              disabled={isVerifying}
            >
              🔍 Verify Presentation
            </button>
          </div>
        </div>
      )}

      <div className="verification-results">
        <h3>🎯 Verification Results</h3>
        {verificationResults.length === 0 ? (
          <p className="no-results">No verification results yet</p>
        ) : (
          <div className="results-list">
            {verificationResults.map((result, index) => (
              <div key={index}>
                {formatVerificationResult(result)}
              </div>
            ))}
          </div>
        )}
      </div>

      {verificationHistory.length > 0 && (
        <div className="verification-history">
          <h3>📊 Verification History</h3>
          <div className="history-stats">
            <p><strong>Total Verifications:</strong> {verificationHistory.length}</p>
            <p><strong>Valid:</strong> {verificationHistory.filter(r => r.isValid).length}</p>
            <p><strong>Invalid:</strong> {verificationHistory.filter(r => !r.isValid).length}</p>
          </div>
          <details className="history-details">
            <summary>View All History ({verificationHistory.length})</summary>
            <div className="history-list">
              {verificationHistory.slice(0, 10).map((result, index) => (
                <div key={index} className={`history-item ${result.isValid ? 'valid' : 'invalid'}`}>
                  <span className="timestamp">{result.verifiedAt.toLocaleString()}</span>
                  <span className="credential">{result.credentialId}</span>
                  <span className={`status ${result.isValid ? 'valid' : 'invalid'}`}>
                    {result.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}