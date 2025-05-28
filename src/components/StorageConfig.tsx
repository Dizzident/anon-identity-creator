import { StorageType } from '../types/storage'
import './StorageConfig.css'

interface StorageConfigProps {
  currentType: StorageType
  onTypeChange: (type: StorageType) => void
}

export function StorageConfig({ currentType, onTypeChange }: StorageConfigProps) {
  return (
    <div className="storage-config">
      <h3>Storage Configuration</h3>
      <div className="storage-options">
        <label>
          <input
            type="radio"
            name="storage"
            value="memory"
            checked={currentType === 'memory'}
            onChange={(e) => onTypeChange(e.target.value as StorageType)}
          />
          <span>Memory (No persistence)</span>
          <small>Data is lost on page refresh</small>
        </label>
        <label>
          <input
            type="radio"
            name="storage"
            value="localStorage"
            checked={currentType === 'localStorage'}
            onChange={(e) => onTypeChange(e.target.value as StorageType)}
          />
          <span>Local Storage</span>
          <small>Persists across browser sessions</small>
        </label>
        <label>
          <input
            type="radio"
            name="storage"
            value="sessionStorage"
            checked={currentType === 'sessionStorage'}
            onChange={(e) => onTypeChange(e.target.value as StorageType)}
          />
          <span>Session Storage</span>
          <small>Persists until tab is closed</small>
        </label>
      </div>
      <div className="storage-info">
        <p>Current storage: <strong>{currentType}</strong></p>
      </div>
    </div>
  )
}