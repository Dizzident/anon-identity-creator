import { useState } from 'react'
import { CryptoService } from 'anon-identity'
import { Identity } from '../types/identity'
import './IdentityCreator.css'

interface IdentityCreatorProps {
  onIdentityCreated: (identity: Identity) => void
}

function IdentityCreator({ onIdentityCreated }: IdentityCreatorProps) {
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert('Please enter a name for the identity')
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
        createdAt: new Date()
      }
      
      onIdentityCreated(newIdentity)
      setName('')
    } catch (error) {
      console.error('Error creating identity:', error)
      alert('Failed to create identity. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="identity-creator">
      <h2>Create New Identity</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Identity Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter identity name"
            disabled={isCreating}
          />
        </div>
        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create Identity'}
        </button>
      </form>
    </div>
  )
}

export default IdentityCreator