import { useState } from 'react'
import { CryptoService } from '../utils/crypto'
import { Identity, IdentityAttributes } from '../types/identity'
import { ENHANCED_SCHEMA, validateAttributes } from '../utils/anonIdentity'
import './IdentityCreator.css'

interface IdentityCreatorProps {
  onIdentityCreated: (identity: Identity) => void
}

function IdentityCreator({ onIdentityCreated }: IdentityCreatorProps) {
  const [name, setName] = useState('')
  const [attributes, setAttributes] = useState<IdentityAttributes>({})
  const [isCreating, setIsCreating] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleAttributeChange = (fieldName: string, value: any) => {
    setAttributes(prev => ({
      ...prev,
      [fieldName]: value
    }))
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert('Please enter a name for the identity')
      return
    }

    // Validate attributes
    const validation = validateAttributes(attributes)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setIsCreating(true)
    
    try {
      const keyPair = await CryptoService.generateKeyPair()
      
      // Convert Uint8Array to base64 strings for storage
      const publicKeyBase64 = btoa(String.fromCharCode(...keyPair.publicKey))
      const privateKeyBase64 = btoa(String.fromCharCode(...keyPair.privateKey))
      
      const newIdentity: Identity = {
        id: crypto.randomUUID(),
        name: name.trim(),
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64,
        createdAt: new Date(),
        attributes: { ...attributes }
      }
      
      onIdentityCreated(newIdentity)
      setName('')
      setAttributes({})
      setErrors([])
    } catch (error) {
      console.error('Error creating identity:', error)
      alert('Failed to create identity. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const renderField = (field: typeof ENHANCED_SCHEMA[0]) => {
    const value = attributes[field.name] || ''
    
    switch (field.type) {
      case 'boolean':
        return (
          <div className="form-group" key={field.name}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={value === true}
                onChange={(e) => handleAttributeChange(field.name, e.target.checked)}
                disabled={isCreating}
              />
              {field.label}
            </label>
          </div>
        )
      
      case 'date':
        return (
          <div className="form-group" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input
              type="date"
              id={field.name}
              value={value}
              onChange={(e) => handleAttributeChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              disabled={isCreating}
            />
          </div>
        )
      
      default:
        return (
          <div className="form-group" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input
              type="text"
              id={field.name}
              value={value}
              onChange={(e) => handleAttributeChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              disabled={isCreating}
            />
          </div>
        )
    }
  }

  return (
    <div className="identity-creator">
      <h2>Create New Identity</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Identity Name *</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter identity name"
            disabled={isCreating}
            required
          />
        </div>
        
        <div className="schema-fields">
          <h3>Profile Information</h3>
          <p className="schema-description">Fill in any additional information you'd like to include with this identity.</p>
          
          {ENHANCED_SCHEMA.map(renderField)}
        </div>

        {errors.length > 0 && (
          <div className="error-messages">
            {errors.map((error, index) => (
              <div key={index} className="error-message">{error}</div>
            ))}
          </div>
        )}

        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create Identity'}
        </button>
      </form>
    </div>
  )
}

export default IdentityCreator