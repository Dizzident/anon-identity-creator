import { useState } from 'react'
import { Identity } from '../types/identity'
import { ENHANCED_SCHEMA } from '../utils/anonIdentity'
import { QRCodeModal } from './QRCodeModal'
import './IdentityCard.css'

interface IdentityCardProps {
  identity: Identity
  onDelete: (id: string) => void
}

function IdentityCard({ identity, onDelete }: IdentityCardProps) {
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showAttributes, setShowAttributes] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)

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

  // Get populated attributes
  const populatedAttributes = ENHANCED_SCHEMA.filter(field => {
    const value = identity.attributes?.[field.name]
    return value !== undefined && value !== null && value !== ''
  })

  return (
    <div className="identity-card">
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
        <label>Public Key:</label>
        <div className="field-value">
          <code>{identity.publicKey.substring(0, 50)}...</code>
          <button
            className="copy-button"
            onClick={() => handleCopy(identity.publicKey, 'public')}
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
              ? identity.privateKey 
              : '••••••••••••••••••••••••••••••••••••••••••••'}
          </code>
          <button
            className="toggle-button"
            onClick={() => setShowPrivateKey(!showPrivateKey)}
          >
            {showPrivateKey ? '🙈' : '👁️'}
          </button>
          {showPrivateKey && (
            <button
              className="copy-button"
              onClick={() => handleCopy(identity.privateKey, 'private')}
            >
              {copied === 'private' ? '✓' : '📋'}
            </button>
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
                    {formatAttributeValue(identity.attributes[field.name], field.type)}
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
      </div>
      
      <QRCodeModal 
        identity={identity}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </div>
  )
}

export default IdentityCard