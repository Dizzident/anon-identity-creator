import { useState } from 'react'
import { Identity } from '../types/identity'
import './IdentityCard.css'

interface IdentityCardProps {
  identity: Identity
  onDelete: (id: string) => void
}

function IdentityCard({ identity, onDelete }: IdentityCardProps) {
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

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

      <div className="identity-field">
        <label>Created:</label>
        <span>{formatDate(identity.createdAt)}</span>
      </div>
    </div>
  )
}

export default IdentityCard