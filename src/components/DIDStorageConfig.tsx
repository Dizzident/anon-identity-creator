import { useState } from 'react'
import './DIDStorageConfig.css'

export type DIDStorageType = 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB' | 'hybrid'

interface DIDStorageConfigProps {
  currentType: DIDStorageType
  onTypeChange: (type: DIDStorageType) => void
  storageStats?: {
    identityCount: number
    credentialCount: number
    lastSync?: Date
  }
}

export function DIDStorageConfig({ currentType, onTypeChange, storageStats }: DIDStorageConfigProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [hybridOptions, setHybridOptions] = useState({
    localStorage: true,
    indexedDB: true,
    sessionStorage: false
  })

  const handleTypeChange = (type: DIDStorageType) => {
    onTypeChange(type)
  }

  const storageDescriptions = {
    memory: {
      title: 'Memory Storage',
      desc: 'Temporary storage - data lost on refresh',
      icon: '🧠',
      pros: ['Fast access', 'No storage limits'],
      cons: ['No persistence', 'Lost on refresh']
    },
    localStorage: {
      title: 'Local Storage',
      desc: 'Browser storage - persists across sessions',
      icon: '💾',
      pros: ['Simple & reliable', 'Persists data', '~10MB limit'],
      cons: ['Synchronous API', 'Limited size']
    },
    sessionStorage: {
      title: 'Session Storage',
      desc: 'Temporary browser storage - cleared on tab close',
      icon: '📋',
      pros: ['Per-tab isolation', 'Auto-cleanup'],
      cons: ['Lost on tab close', 'Limited size']
    },
    indexedDB: {
      title: 'IndexedDB',
      desc: 'Advanced browser database - unlimited storage',
      icon: '🗄️',
      pros: ['Large storage', 'Async API', 'Structured data'],
      cons: ['More complex', 'Browser differences']
    },
    hybrid: {
      title: 'Hybrid Storage',
      desc: 'Multiple backends for redundancy',
      icon: '🔄',
      pros: ['Redundancy', 'Fallback options', 'Best reliability'],
      cons: ['Slightly slower', 'More complex']
    }
  }

  return (
    <div className="did-storage-config">
      <div className="storage-header">
        <h3>DID Storage Configuration</h3>
        {storageStats && (
          <div className="storage-stats">
            <span>📊 {storageStats.identityCount} identities</span>
            <span>📜 {storageStats.credentialCount} credentials</span>
            {storageStats.lastSync && (
              <span>🔄 Last sync: {storageStats.lastSync.toLocaleTimeString()}</span>
            )}
          </div>
        )}
      </div>

      <div className="storage-options">
        {Object.entries(storageDescriptions).map(([type, info]) => (
          <div 
            key={type}
            className={`storage-option ${currentType === type ? 'selected' : ''}`}
            onClick={() => handleTypeChange(type as DIDStorageType)}
          >
            <div className="option-header">
              <span className="option-icon">{info.icon}</span>
              <div className="option-info">
                <h4>{info.title}</h4>
                <p>{info.desc}</p>
              </div>
              <input
                type="radio"
                name="did-storage"
                value={type}
                checked={currentType === type}
                onChange={() => handleTypeChange(type as DIDStorageType)}
              />
            </div>
            
            {showAdvanced && (
              <div className="option-details">
                <div className="pros-cons">
                  <div className="pros">
                    <strong>✅ Pros:</strong>
                    <ul>
                      {info.pros.map((pro, i) => (
                        <li key={i}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="cons">
                    <strong>❌ Cons:</strong>
                    <ul>
                      {info.cons.map((con, i) => (
                        <li key={i}>{con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {type === 'hybrid' && currentType === 'hybrid' && (
              <div className="hybrid-config">
                <h5>Select Storage Backends:</h5>
                <label>
                  <input
                    type="checkbox"
                    checked={hybridOptions.localStorage}
                    onChange={(e) => setHybridOptions({
                      ...hybridOptions,
                      localStorage: e.target.checked
                    })}
                  />
                  Local Storage
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={hybridOptions.indexedDB}
                    onChange={(e) => setHybridOptions({
                      ...hybridOptions,
                      indexedDB: e.target.checked
                    })}
                  />
                  IndexedDB
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={hybridOptions.sessionStorage}
                    onChange={(e) => setHybridOptions({
                      ...hybridOptions,
                      sessionStorage: e.target.checked
                    })}
                  />
                  Session Storage
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      <button 
        className="advanced-toggle"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? '🔼 Hide Details' : '🔽 Show Details'}
      </button>

      <div className="storage-recommendations">
        <h4>💡 Recommendations</h4>
        <ul>
          <li><strong>For Testing:</strong> Use Memory Storage</li>
          <li><strong>For Personal Use:</strong> Use Local Storage or IndexedDB</li>
          <li><strong>For Maximum Reliability:</strong> Use Hybrid Storage</li>
          <li><strong>For Privacy:</strong> Use Session Storage (auto-clears)</li>
        </ul>
      </div>

      <div className="storage-actions">
        <button className="export-btn" onClick={() => alert('Export feature coming soon!')}>
          📤 Export Identities
        </button>
        <button className="import-btn" onClick={() => alert('Import feature coming soon!')}>
          📥 Import Identities
        </button>
        <button className="clear-btn" onClick={() => {
          if (window.confirm('Are you sure you want to clear all stored identities?')) {
            alert('Storage cleared!')
          }
        }}>
          🗑️ Clear Storage
        </button>
      </div>
    </div>
  )
}