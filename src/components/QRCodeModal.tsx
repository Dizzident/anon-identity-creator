import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { Identity } from '../types/identity'
import { createTransferData } from '../types/transfer'
import './QRCodeModal.css'

interface QRCodeModalProps {
  identity: Identity
  isOpen: boolean
  onClose: () => void
}

export function QRCodeModal({ identity, isOpen, onClose }: QRCodeModalProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [transferData, setTransferData] = useState<string>('')

  useEffect(() => {
    if (isOpen && identity) {
      generateQRCode()
    }
  }, [isOpen, identity])

  const generateQRCode = async () => {
    setIsGenerating(true)
    try {
      const transferInfo = createTransferData(identity)
      const transferDataString = JSON.stringify(transferInfo)
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
              ⚠️ <strong>Security Warning:</strong> This QR code contains your private key. 
              Only scan it with trusted apps and ensure you're in a secure environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}