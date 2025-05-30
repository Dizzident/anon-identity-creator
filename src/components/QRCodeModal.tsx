import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { Identity, DIDIdentity } from '../types/identity'
import { createTransferData } from '../types/transfer'
import { MockDIDService } from '../services/mockDIDService'
import './QRCodeModal.css'

interface QRCodeModalProps {
  identity: Identity | DIDIdentity
  isOpen: boolean
  onClose: () => void
}

export function QRCodeModal({ identity, isOpen, onClose }: QRCodeModalProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [transferData, setTransferData] = useState<string>('')
  const [transferMode, setTransferMode] = useState<'full' | 'presentation' | 'selective'>('full')
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (isOpen && identity) {
      generateQRCode()
    }
  }, [isOpen, identity, transferMode, selectedAttributes])

  // Helper to convert DID identity to legacy format for transfer
  const convertToLegacyFormat = (identity: Identity | DIDIdentity): Identity => {
    if ('did' in identity && 'credentials' in identity) {
      // It's a DID identity, convert to legacy format
      const didIdentity = identity as DIDIdentity
      const attributes = extractAttributesFromCredentials(didIdentity.credentials)
      
      return {
        id: didIdentity.id,
        name: didIdentity.name,
        publicKey: didIdentity.did.id,
        privateKey: 'DID_MANAGED_KEY', // Placeholder for DID-managed keys
        createdAt: didIdentity.createdAt,
        attributes
      }
    }
    return identity as Identity
  }

  // Extract attributes from credentials (simplified version)
  const extractAttributesFromCredentials = (credentials: any[]): Record<string, any> => {
    const attributes: Record<string, any> = {}
    credentials.forEach(credential => {
      if (credential.credentialSubject && typeof credential.credentialSubject === 'object') {
        Object.keys(credential.credentialSubject).forEach(key => {
          if (key !== 'id') {
            attributes[key] = credential.credentialSubject[key]
          }
        })
      }
    })
    return attributes
  }

  const generateQRCode = async () => {
    setIsGenerating(true)
    try {
      let transferDataString = ''
      
      if (transferMode === 'full') {
        // Legacy full transfer
        const legacyIdentity = convertToLegacyFormat(identity)
        const transferInfo = createTransferData(legacyIdentity)
        transferDataString = JSON.stringify(transferInfo)
      } else if (transferMode === 'presentation' && isDIDIdentity(identity)) {
        // Create verifiable presentation
        const didIdentity = identity as DIDIdentity
        const presentation = await MockDIDService.createVerifiablePresentation(didIdentity)
        transferDataString = JSON.stringify({
          type: 'VerifiablePresentation',
          presentation,
          metadata: {
            createdAt: new Date().toISOString(),
            issuerName: didIdentity.name,
            credentialCount: didIdentity.credentials.length
          }
        })
      } else if (transferMode === 'selective' && isDIDIdentity(identity)) {
        // Create selective disclosure presentation
        const didIdentity = identity as DIDIdentity
        
        // Create selective credentials based on selected attributes
        const selectiveCredentials = didIdentity.credentials.map(credential => {
          const selectedSubject: any = { id: credential.credentialSubject.id }
          
          selectedAttributes.forEach(attr => {
            if (credential.credentialSubject[attr] !== undefined) {
              selectedSubject[attr] = credential.credentialSubject[attr]
            }
          })
          
          return {
            ...credential,
            credentialSubject: selectedSubject,
            selectiveDisclosure: {
              originalCredentialId: credential.id,
              disclosedAttributes: selectedAttributes,
              timestamp: new Date().toISOString()
            }
          }
        })
        
        const selectiveIdentity = { ...didIdentity, credentials: selectiveCredentials }
        const presentation = await MockDIDService.createVerifiablePresentation(selectiveIdentity)
        
        transferDataString = JSON.stringify({
          type: 'SelectiveDisclosurePresentation',
          presentation,
          metadata: {
            createdAt: new Date().toISOString(),
            issuerName: didIdentity.name,
            disclosedAttributes: selectedAttributes
          }
        })
      } else {
        // Fallback to legacy format
        const legacyIdentity = convertToLegacyFormat(identity)
        const transferInfo = createTransferData(legacyIdentity)
        transferDataString = JSON.stringify(transferInfo)
      }
      
      setTransferData(transferDataString)
      
      const qrDataURL = await QRCode.toDataURL(transferDataString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })
      
      setQrCodeDataURL(qrDataURL)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const isDIDIdentity = (identity: Identity | DIDIdentity): identity is DIDIdentity => {
    return 'did' in identity && 'credentials' in identity
  }

  const getAvailableAttributes = (): string[] => {
    if (isDIDIdentity(identity)) {
      const attributes = new Set<string>()
      identity.credentials.forEach(credential => {
        Object.keys(credential.credentialSubject).forEach(key => {
          if (key !== 'id') {
            attributes.add(key)
          }
        })
      })
      return Array.from(attributes)
    }
    return []
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transferData)
      alert('Transfer data copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeDataURL) {
      const link = document.createElement('a')
      link.href = qrCodeDataURL
      link.download = `identity-${identity.name}-qr.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (!isOpen) return null

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <h3>Transfer Identity to Mobile App</h3>
          <button className="qr-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="qr-modal-body">
          {/* Transfer Mode Selection */}
          {isDIDIdentity(identity) && (
            <div className="transfer-mode-section">
              <h4>Transfer Mode</h4>
              <div className="transfer-mode-options">
                <label className={`transfer-mode-option ${transferMode === 'full' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="transferMode"
                    value="full"
                    checked={transferMode === 'full'}
                    onChange={() => setTransferMode('full')}
                  />
                  <div className="mode-info">
                    <strong>📦 Full Transfer</strong>
                    <small>Transfer complete identity with all credentials</small>
                  </div>
                </label>
                <label className={`transfer-mode-option ${transferMode === 'presentation' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="transferMode"
                    value="presentation"
                    checked={transferMode === 'presentation'}
                    onChange={() => setTransferMode('presentation')}
                  />
                  <div className="mode-info">
                    <strong>🎫 Verifiable Presentation</strong>
                    <small>Share verifiable credentials without private data</small>
                  </div>
                </label>
                <label className={`transfer-mode-option ${transferMode === 'selective' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="transferMode"
                    value="selective"
                    checked={transferMode === 'selective'}
                    onChange={() => {
                      setTransferMode('selective')
                      setShowAdvanced(true)
                    }}
                  />
                  <div className="mode-info">
                    <strong>🔐 Selective Disclosure</strong>
                    <small>Choose specific attributes to share</small>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Selective Attribute Picker */}
          {transferMode === 'selective' && isDIDIdentity(identity) && showAdvanced && (
            <div className="selective-attributes-section">
              <h4>Select Attributes to Share</h4>
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
              {selectedAttributes.length === 0 && (
                <p className="no-selection-warning">⚠️ Please select at least one attribute to share</p>
              )}
            </div>
          )}

          <div className="qr-code-section">
            <h4>Scan QR Code</h4>
            <div className="qr-code-container">
              {isGenerating ? (
                <div className="qr-loading">Generating QR Code...</div>
              ) : qrCodeDataURL ? (
                <img src={qrCodeDataURL} alt="Identity Transfer QR Code" />
              ) : (
                <div className="qr-error">Failed to generate QR code</div>
              )}
            </div>
            
            {qrCodeDataURL && (
              <div className="qr-actions">
                <button onClick={downloadQRCode} className="qr-download-btn">
                  Download QR Code
                </button>
                <button onClick={copyToClipboard} className="qr-copy-btn">
                  Copy Transfer Data
                </button>
              </div>
            )}
          </div>
          
          <div className="transfer-info">
            <h4>Transfer Information</h4>
            <div className="transfer-details">
              <p><strong>Identity:</strong> {identity.name}</p>
              <p><strong>ID:</strong> {identity.id}</p>
              <p><strong>Created:</strong> {
                typeof identity.createdAt === 'string' 
                  ? new Date(identity.createdAt).toLocaleDateString()
                  : identity.createdAt.toLocaleDateString()
              }</p>
              {isDIDIdentity(identity) && (
                <>
                  <p><strong>Transfer Mode:</strong> {
                    transferMode === 'full' ? 'Full Transfer' :
                    transferMode === 'presentation' ? 'Verifiable Presentation' :
                    'Selective Disclosure'
                  }</p>
                  {transferMode === 'selective' && selectedAttributes.length > 0 && (
                    <p><strong>Shared Attributes:</strong> {selectedAttributes.join(', ')}</p>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="transfer-instructions">
            <h4>Instructions</h4>
            <ol>
              <li>Open your mobile identity app</li>
              <li>Look for "Import Identity" or "Scan QR Code" option</li>
              <li>Scan the QR code above</li>
              <li>Verify the identity details match</li>
              <li>Complete the transfer process</li>
            </ol>
            <p className="security-warning">
              ⚠️ <strong>Security Warning:</strong> {
                transferMode === 'full' 
                  ? 'This QR code contains your private key. Only scan it with trusted apps and ensure you\'re in a secure environment.'
                  : transferMode === 'presentation'
                  ? 'This QR code contains a verifiable presentation. The recipient can verify your credentials without accessing private data.'
                  : 'This QR code contains only the selected attributes. Your other data remains private.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}