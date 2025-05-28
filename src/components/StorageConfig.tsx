import { useState } from 'react'
import { StorageType, StorageConfig as StorageConfigType } from '../types/storage'
import './StorageConfig.css'

interface StorageConfigProps {
  currentType: StorageType
  onTypeChange: (type: StorageType, config?: Partial<StorageConfigType>) => void
  storageInfo?: { hash?: string; txHash?: string; gateway?: string }
}

export function StorageConfig({ currentType, onTypeChange, storageInfo }: StorageConfigProps) {
  const [ipfsGateway, setIpfsGateway] = useState('https://ipfs.io/ipfs/')
  const [blockchainNetwork, setBlockchainNetwork] = useState<'ethereum' | 'polygon' | 'arbitrum'>('ethereum')

  const handleTypeChange = (type: StorageType) => {
    const config: Partial<StorageConfigType> = {}
    if (type === 'ipfs') {
      config.ipfsGateway = ipfsGateway
    } else if (type === 'blockchain') {
      config.blockchainNetwork = blockchainNetwork
    }
    onTypeChange(type, config)
  }

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
            onChange={(e) => handleTypeChange(e.target.value as StorageType)}
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
            onChange={(e) => handleTypeChange(e.target.value as StorageType)}
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
            onChange={(e) => handleTypeChange(e.target.value as StorageType)}
          />
          <span>Session Storage</span>
          <small>Persists until tab is closed</small>
        </label>
        <label>
          <input
            type="radio"
            name="storage"
            value="ipfs"
            checked={currentType === 'ipfs'}
            onChange={(e) => handleTypeChange(e.target.value as StorageType)}
          />
          <span>IPFS (Decentralized)</span>
          <small>Stored on InterPlanetary File System</small>
        </label>
        <label>
          <input
            type="radio"
            name="storage"
            value="blockchain"
            checked={currentType === 'blockchain'}
            onChange={(e) => handleTypeChange(e.target.value as StorageType)}
          />
          <span>Blockchain (Immutable)</span>
          <small>Stored on-chain (simulated)</small>
        </label>
      </div>
      
      {currentType === 'ipfs' && (
        <div className="storage-config-options">
          <label>
            <span>IPFS Gateway:</span>
            <input
              type="text"
              value={ipfsGateway}
              onChange={(e) => setIpfsGateway(e.target.value)}
              placeholder="https://ipfs.io/ipfs/"
            />
          </label>
        </div>
      )}
      
      {currentType === 'blockchain' && (
        <div className="storage-config-options">
          <label>
            <span>Network:</span>
            <select
              value={blockchainNetwork}
              onChange={(e) => setBlockchainNetwork(e.target.value as 'ethereum' | 'polygon' | 'arbitrum')}
            >
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="arbitrum">Arbitrum</option>
            </select>
          </label>
        </div>
      )}

      <div className="storage-info">
        <p>Current storage: <strong>{currentType}</strong></p>
        {storageInfo?.hash && (
          <p>IPFS Hash: <code>{storageInfo.hash}</code></p>
        )}
        {storageInfo?.txHash && (
          <p>Transaction Hash: <code>{storageInfo.txHash}</code></p>
        )}
      </div>
    </div>
  )
}