import { useState } from 'react'
import { DIDIdentity } from '../types/identity'
import { MockDIDService } from '../services/mockDIDService'
import './SelectiveDisclosure.css'

interface SelectiveDisclosureProps {
  identity: DIDIdentity
  onPresentationCreated?: (presentation: any) => void
}

interface AttributeSelection {
  credentialId: string
  attributeName: string
  attributeValue: any
  selected: boolean
}

export function SelectiveDisclosure({ identity, onPresentationCreated }: SelectiveDisclosureProps) {
  const [selections, setSelections] = useState<AttributeSelection[]>([])
  const [showPresentation, setShowPresentation] = useState(false)
  const [presentation, setPresentation] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Initialize selections from credentials
  useState(() => {
    const initialSelections: AttributeSelection[] = []
    
    identity.credentials.forEach(credential => {
      const subject = credential.credentialSubject
      Object.keys(subject).forEach(key => {
        if (key !== 'id') {
          initialSelections.push({
            credentialId: credential.id,
            attributeName: key,
            attributeValue: subject[key],
            selected: false
          })
        }
      })
    })
    
    setSelections(initialSelections)
  })

  const handleSelectionChange = (index: number) => {
    const newSelections = [...selections]
    newSelections[index].selected = !newSelections[index].selected
    setSelections(newSelections)
  }

  const handleSelectAll = () => {
    const allSelected = selections.every(s => s.selected)
    setSelections(selections.map(s => ({ ...s, selected: !allSelected })))
  }

  const getSelectedAttributes = () => {
    return selections.filter(s => s.selected)
  }

  const createSelectivePresentation = async () => {
    setIsGenerating(true)
    try {
      const selectedAttrs = getSelectedAttributes()
      
      if (selectedAttrs.length === 0) {
        alert('Please select at least one attribute to disclose')
        return
      }

      // Create selective disclosure credentials
      const selectiveCredentials = identity.credentials.map(credential => {
        const selectedForThisCredential = selectedAttrs.filter(
          attr => attr.credentialId === credential.id
        )
        
        if (selectedForThisCredential.length === 0) {
          return null
        }

        // Create a new credential with only selected attributes
        const selectiveSubject: any = { id: credential.credentialSubject.id }
        selectedForThisCredential.forEach(attr => {
          selectiveSubject[attr.attributeName] = attr.attributeValue
        })

        return {
          ...credential,
          credentialSubject: selectiveSubject,
          // Add selective disclosure metadata
          selectiveDisclosure: {
            originalCredentialId: credential.id,
            disclosedAttributes: selectedForThisCredential.map(a => a.attributeName),
            timestamp: new Date().toISOString()
          }
        }
      }).filter(c => c !== null)

      // Create presentation with selective credentials
      const selectivePresentation = await MockDIDService.createVerifiablePresentation(
        { ...identity, credentials: selectiveCredentials },
        selectiveCredentials.map(c => c!.id)
      )

      setPresentation(selectivePresentation)
      setShowPresentation(true)
      
      if (onPresentationCreated) {
        onPresentationCreated(selectivePresentation)
      }
    } catch (error) {
      console.error('Failed to create selective presentation:', error)
      alert('Failed to create presentation')
    } finally {
      setIsGenerating(false)
    }
  }

  const formatAttributeName = (name: string): string => {
    // Convert camelCase to Title Case
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  const formatAttributeValue = (value: any): string => {
    if (value === null || value === undefined) return 'Not provided'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  return (
    <div className="selective-disclosure">
      <h3>Selective Disclosure</h3>
      <p className="disclosure-description">
        Choose which attributes you want to share. Only selected information will be included in the presentation.
      </p>

      <div className="attribute-selection">
        <div className="selection-header">
          <h4>Available Attributes</h4>
          <button 
            className="select-all-btn"
            onClick={handleSelectAll}
          >
            {selections.every(s => s.selected) ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="attribute-list">
          {selections.map((selection, index) => (
            <div key={index} className="attribute-item">
              <label>
                <input
                  type="checkbox"
                  checked={selection.selected}
                  onChange={() => handleSelectionChange(index)}
                />
                <span className="attribute-name">
                  {formatAttributeName(selection.attributeName)}
                </span>
                <span className="attribute-value">
                  {formatAttributeValue(selection.attributeValue)}
                </span>
              </label>
            </div>
          ))}
        </div>

        {selections.length === 0 && (
          <p className="no-attributes">No attributes available for disclosure</p>
        )}
      </div>

      <div className="disclosure-actions">
        <button
          className="create-presentation-btn"
          onClick={createSelectivePresentation}
          disabled={isGenerating || selections.filter(s => s.selected).length === 0}
        >
          {isGenerating ? 'Creating...' : 'Create Presentation'}
        </button>
        
        <div className="selected-count">
          {getSelectedAttributes().length} of {selections.length} attributes selected
        </div>
      </div>

      {showPresentation && presentation && (
        <div className="presentation-result">
          <h4>Verifiable Presentation Created</h4>
          <div className="presentation-details">
            <p><strong>Type:</strong> Selective Disclosure Presentation</p>
            <p><strong>Attributes Disclosed:</strong> {getSelectedAttributes().length}</p>
            <p><strong>Credentials Included:</strong> {presentation.verifiableCredential.length}</p>
            
            <div className="disclosed-attributes">
              <h5>Disclosed Information:</h5>
              <ul>
                {getSelectedAttributes().map((attr, index) => (
                  <li key={index}>
                    {formatAttributeName(attr.attributeName)}: {formatAttributeValue(attr.attributeValue)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="presentation-actions">
            <button 
              className="copy-presentation-btn"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(presentation, null, 2))
                alert('Presentation copied to clipboard!')
              }}
            >
              Copy Presentation
            </button>
            <button 
              className="close-presentation-btn"
              onClick={() => setShowPresentation(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}