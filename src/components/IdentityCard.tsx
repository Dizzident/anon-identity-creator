import { useState } from 'react'
import { Identity, DIDIdentity } from '../types/identity'
import { ENHANCED_SCHEMA } from '../utils/anonIdentity'
import { QRCodeModal } from './QRCodeModal'
import { SelectiveDisclosure } from './SelectiveDisclosure'
import { CredentialManager } from './CredentialManager'
import { MockDIDService } from '../services/mockDIDService'
import './IdentityCard.css'

interface IdentityCardProps {
  identity: Identity | DIDIdentity
  useDIDMode?: boolean
  onDelete: (id: string) => void
  onUpdate?: (updatedIdentity: DIDIdentity) => void
}

function IdentityCard({ identity, useDIDMode = false, onDelete, onUpdate }: IdentityCardProps) {
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showAttributes, setShowAttributes] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showSelectiveDisclosure, setShowSelectiveDisclosure] = useState(false)
  const [showCredentialManager, setShowCredentialManager] = useState(false)

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(field)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString()
  }

  const formatAttributeValue = (value: any, type: string) => {
    if (value === undefined || value === null || value === '') {
      return 'Not provided'
    }
    
    if (type === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    
    if (type === 'date') {
      return new Date(value).toLocaleDateString()
    }
    
    return value.toString()
  }

  // Helper to check if identity is DID-based
  const isDIDIdentity = (identity: Identity | DIDIdentity): identity is DIDIdentity => {
    return useDIDMode && 'did' in identity && 'credentials' in identity
  }

  // Get attributes from either legacy or DID identity
  const getAttributes = () => {
    if (isDIDIdentity(identity)) {
      return MockDIDService.extractAttributesFromCredentials(identity.credentials)
    } else {
      return (identity as Identity).attributes || {}
    }
  }

  // Get public key display
  const getPublicKeyDisplay = () => {
    if (isDIDIdentity(identity)) {
      return identity.did.toString()
    } else {
      return (identity as Identity).publicKey
    }
  }

  // Get private key display (only for legacy mode)
  const getPrivateKeyDisplay = () => {
    if (isDIDIdentity(identity)) {
      return 'Managed by DID/VC Framework'
    } else {
      return (identity as Identity).privateKey
    }
  }

  const attributes = getAttributes()

  // Get populated attributes
  const populatedAttributes = ENHANCED_SCHEMA.filter(field => {
    const value = attributes?.[field.name]
    return value !== undefined && value !== null && value !== ''
  })

  return (
    <div className={`identity-card ${isDIDIdentity(identity) ? 'did-mode' : ''}`}>
      <div className="identity-header">
        <h3>{identity.name}</h3>
        <button 
          className="delete-button"
          onClick={() => onDelete(identity.id)}
          title="Delete identity"
        >
          ×
        </button>
      </div>
      
      <div className="identity-field">
        <label>{isDIDIdentity(identity) ? 'DID:' : 'Public Key:'}</label>
        <div className="field-value">
          <code>{getPublicKeyDisplay().substring(0, 50)}...</code>
          <button
            className="copy-button"
            onClick={() => handleCopy(getPublicKeyDisplay(), 'public')}
          >
            {copied === 'public' ? '✓' : '📋'}
          </button>
        </div>
      </div>

      <div className="identity-field">
        <label>Private Key:</label>
        <div className="field-value">
          <code>
            {showPrivateKey 
              ? getPrivateKeyDisplay() 
              : '••••••••••••••••••••••••••••••••••••••••••••'}
          </code>
          {!isDIDIdentity(identity) && (
            <>
              <button
                className="toggle-button"
                onClick={() => setShowPrivateKey(!showPrivateKey)}
              >
                {showPrivateKey ? '🙈' : '👁️'}
              </button>
              {showPrivateKey && (
                <button
                  className="copy-button"
                  onClick={() => handleCopy(getPrivateKeyDisplay(), 'private')}
                >
                  {copied === 'private' ? '✓' : '📋'}
                </button>
              )}
            </>
          )}
          {isDIDIdentity(identity) && (
            <span className="did-note">Securely managed by wallet</span>
          )}
        </div>
      </div>

      {populatedAttributes.length > 0 && (
        <div className="identity-field">
          <div className="attributes-header">
            <label>Profile Information:</label>
            <button
              className="toggle-button"
              onClick={() => setShowAttributes(!showAttributes)}
            >
              {showAttributes ? '🔼' : '🔽'}
            </button>
          </div>
          
          {showAttributes && (
            <div className="attributes-section">
              {populatedAttributes.map(field => (
                <div key={field.name} className="attribute-item">
                  <span className="attribute-label">{field.label}:</span>
                  <span className="attribute-value">
                    {formatAttributeValue(attributes[field.name], field.type)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="identity-field">
        <label>Created:</label>
        <span>{formatDate(identity.createdAt)}</span>
      </div>
      
      <div className="identity-actions">
        <button 
          className="qr-button"
          onClick={() => setShowQRModal(true)}
          title="Generate QR code for mobile transfer"
        >
          📱 Transfer to Mobile
        </button>
        
        {isDIDIdentity(identity) && (
          <>
            <button 
              className="selective-disclosure-button"
              onClick={() => setShowSelectiveDisclosure(!showSelectiveDisclosure)}
              title="Create selective disclosure presentation"
            >
              🔐 Selective Disclosure
            </button>
            <button 
              className="credential-manager-button"
              onClick={() => setShowCredentialManager(!showCredentialManager)}
              title="Manage credentials"
            >
              📜 Manage Credentials
            </button>
          </>
        )}
      </div>
      
      {isDIDIdentity(identity) && showSelectiveDisclosure && (
        <SelectiveDisclosure 
          identity={identity as DIDIdentity}
          onPresentationCreated={(presentation) => {
            console.log('Presentation created:', presentation)
          }}
        />
      )}
      
      {isDIDIdentity(identity) && showCredentialManager && (
        <CredentialManager 
          identity={identity as DIDIdentity}
          onIdentityUpdate={(updatedIdentity) => {
            if (onUpdate) {
              onUpdate(updatedIdentity)
            }
          }}
        />
      )}
      
      <QRCodeModal 
        identity={identity}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </div>
  )
}

export default IdentityCard