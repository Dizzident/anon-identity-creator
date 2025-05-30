import { useState } from 'react'
import { DIDIdentity } from '../types/identity'
import { MockDIDService } from '../services/mockDIDService'
import { ENHANCED_SCHEMA } from '../utils/anonIdentity'
import './CredentialManager.css'

interface CredentialManagerProps {
  identity: DIDIdentity
  onIdentityUpdate: (updatedIdentity: DIDIdentity) => void
}

interface CredentialStatus {
  isValid: boolean
  isRevoked: boolean
  expirationDate?: Date
  isExpired?: boolean
}

export function CredentialManager({ identity, onIdentityUpdate }: CredentialManagerProps) {
  const [showAddCredential, setShowAddCredential] = useState(false)
  const [newCredentialType, setNewCredentialType] = useState('custom')
  const [newCredentialData, setNewCredentialData] = useState<Record<string, any>>({})
  const [isAddingCredential, setIsAddingCredential] = useState(false)

  // Check credential status
  const getCredentialStatus = (credential: any): CredentialStatus => {
    const now = new Date()
    const expirationDate = credential.expirationDate ? new Date(credential.expirationDate) : undefined
    
    return {
      isValid: true, // In mock, all credentials are valid
      isRevoked: false, // In mock, no revocation
      expirationDate,
      isExpired: expirationDate ? expirationDate < now : false
    }
  }

  // Handle credential addition
  const handleAddCredential = async () => {
    if (Object.keys(newCredentialData).length === 0) {
      alert('Please add at least one attribute to the credential')
      return
    }

    setIsAddingCredential(true)
    try {
      const updatedIdentity = await MockDIDService.addCredentialToIdentity(
        identity,
        newCredentialData
      )
      
      onIdentityUpdate(updatedIdentity)
      setShowAddCredential(false)
      setNewCredentialData({})
      alert('Credential added successfully!')
    } catch (error) {
      console.error('Failed to add credential:', error)
      alert('Failed to add credential')
    } finally {
      setIsAddingCredential(false)
    }
  }

  // Handle attribute addition for new credential
  const handleAddAttribute = (name: string, value: any) => {
    setNewCredentialData({
      ...newCredentialData,
      [name]: value
    })
  }

  // Handle attribute removal
  const handleRemoveAttribute = (name: string) => {
    const newData = { ...newCredentialData }
    delete newData[name]
    setNewCredentialData(newData)
  }

  // Format credential type
  const formatCredentialType = (type: string[]): string => {
    return type
      .filter(t => t !== 'VerifiableCredential')
      .join(', ') || 'Identity Credential'
  }

  // Format date
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="credential-manager">
      <h3>Credential Management</h3>
      
      <div className="credentials-list">
        <h4>Current Credentials ({identity.credentials.length})</h4>
        
        {identity.credentials.map((credential) => {
          const status = getCredentialStatus(credential)
          
          return (
            <div key={credential.id} className="credential-item">
              <div className="credential-header">
                <span className="credential-type">
                  {formatCredentialType(credential.type)}
                </span>
                <span className={`credential-status ${status.isExpired ? 'expired' : 'valid'}`}>
                  {status.isExpired ? '⚠️ Expired' : '✅ Valid'}
                </span>
              </div>
              
              <div className="credential-details">
                <p><strong>Issued:</strong> {formatDate(credential.issuanceDate)}</p>
                <p><strong>Issuer:</strong> {credential.issuer}</p>
                {status.expirationDate && (
                  <p><strong>Expires:</strong> {formatDate(status.expirationDate.toISOString())}</p>
                )}
                
                <div className="credential-attributes">
                  <h5>Attributes:</h5>
                  <ul>
                    {Object.entries(credential.credentialSubject)
                      .filter(([key]) => key !== 'id')
                      .map(([key, value]) => (
                        <li key={key}>
                          <span className="attr-name">{key}:</span>
                          <span className="attr-value">{String(value)}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
              
              <div className="credential-actions">
                <button 
                  className="verify-btn"
                  onClick={() => alert('Credential is valid and verified!')}
                >
                  🔍 Verify
                </button>
                <button 
                  className="export-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(credential, null, 2))
                    alert('Credential copied to clipboard!')
                  }}
                >
                  📋 Export
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="add-credential-section">
        <button 
          className="add-credential-btn"
          onClick={() => setShowAddCredential(!showAddCredential)}
        >
          {showAddCredential ? '❌ Cancel' : '➕ Add New Credential'}
        </button>
        
        {showAddCredential && (
          <div className="add-credential-form">
            <h4>Add New Credential</h4>
            
            <div className="credential-type-selector">
              <label>Credential Type:</label>
              <select 
                value={newCredentialType}
                onChange={(e) => setNewCredentialType(e.target.value)}
              >
                <option value="custom">Custom Attributes</option>
                <option value="education">Education</option>
                <option value="employment">Employment</option>
                <option value="certification">Professional Certification</option>
              </select>
            </div>

            <div className="attribute-builder">
              <h5>Attributes:</h5>
              
              {/* Show current attributes */}
              {Object.entries(newCredentialData).map(([key, value]) => (
                <div key={key} className="attribute-row">
                  <span className="attr-key">{key}:</span>
                  <span className="attr-val">{String(value)}</span>
                  <button 
                    className="remove-attr-btn"
                    onClick={() => handleRemoveAttribute(key)}
                  >
                    ❌
                  </button>
                </div>
              ))}

              {/* Quick add buttons for common attributes */}
              <div className="quick-add-attributes">
                <h6>Quick Add:</h6>
                <div className="quick-add-buttons">
                  {ENHANCED_SCHEMA.slice(0, 6).map(field => (
                    <button
                      key={field.name}
                      className="quick-add-btn"
                      onClick={() => {
                        const value = prompt(`Enter ${field.label}:`)
                        if (value) {
                          handleAddAttribute(field.name, value)
                        }
                      }}
                    >
                      + {field.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom attribute input */}
              <div className="custom-attribute-input">
                <input 
                  type="text"
                  placeholder="Attribute name"
                  id="attr-name"
                />
                <input 
                  type="text"
                  placeholder="Attribute value"
                  id="attr-value"
                />
                <button 
                  onClick={() => {
                    const nameInput = document.getElementById('attr-name') as HTMLInputElement
                    const valueInput = document.getElementById('attr-value') as HTMLInputElement
                    
                    if (nameInput.value && valueInput.value) {
                      handleAddAttribute(nameInput.value, valueInput.value)
                      nameInput.value = ''
                      valueInput.value = ''
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="create-credential-btn"
                onClick={handleAddCredential}
                disabled={isAddingCredential || Object.keys(newCredentialData).length === 0}
              >
                {isAddingCredential ? 'Creating...' : 'Create Credential'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="credential-info">
        <h4>ℹ️ About Credentials</h4>
        <p>
          Verifiable Credentials are digital certificates that prove claims about your identity. 
          They are cryptographically signed and can be verified by anyone without contacting the issuer.
        </p>
        <ul>
          <li>✅ <strong>Verifiable:</strong> Anyone can verify the authenticity</li>
          <li>🔒 <strong>Tamper-proof:</strong> Cannot be modified after issuance</li>
          <li>🎯 <strong>Selective:</strong> Share only what's needed</li>
          <li>🌐 <strong>Portable:</strong> Use across different services</li>
        </ul>
      </div>
    </div>
  )
}