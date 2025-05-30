import { useState, useEffect } from 'react'
import IdentityCreator from './components/IdentityCreator'
import IdentityList from './components/IdentityList'
import { StorageConfig } from './components/StorageConfig'
import { DIDStorageConfig, DIDStorageType } from './components/DIDStorageConfig'
import { Identity, DIDIdentity } from './types/identity'
import { StorageType, StorageConfig as StorageConfigType } from './types/storage'
import { createStorageProvider } from './utils/storage'
import { DIDStorageFactory, DIDStorageProvider } from './utils/didStorage'
import { MockDIDService } from './services/mockDIDService'
import './App.css'

function App() {
  const [identities, setIdentities] = useState<Identity[]>([])
  const [didIdentities, setDidIdentities] = useState<DIDIdentity[]>([])
  const [useDIDMode, setUseDIDMode] = useState(true) // Default to new DID mode
  const [storageType, setStorageType] = useState<StorageType>('memory')
  const [didStorageType, setDidStorageType] = useState<DIDStorageType>('localStorage')
  const [, setStorageConfig] = useState<Partial<StorageConfigType>>({})
  const [storageProvider, setStorageProvider] = useState(() => createStorageProvider('memory'))
  const [didStorageProvider, setDidStorageProvider] = useState<DIDStorageProvider | any>(() => DIDStorageFactory.createLocalStorage())
  const [isLoading, setIsLoading] = useState(true)
  const [storageInfo, setStorageInfo] = useState<{ hash?: string; txHash?: string; gateway?: string }>({})

  useEffect(() => {
    const loadIdentities = async () => {
      try {
        if (useDIDMode) {
          // Load DID identities using DID storage provider
          const loaded = await didStorageProvider.load()
          setDidIdentities(loaded)
        } else {
          // Load legacy identities
          const loaded = await storageProvider.load()
          setIdentities(loaded)
        }
      } catch (error) {
        console.error('Failed to load identities:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadIdentities()
  }, [storageProvider, didStorageProvider, useDIDMode])

  useEffect(() => {
    if (!isLoading) {
      if (useDIDMode) {
        // Save DID identities using DID storage provider
        didStorageProvider.save(didIdentities)
          .then(() => {
            if (didStorageProvider.getStorageInfo) {
              return didStorageProvider.getStorageInfo()
            }
          })
          .then((info: any) => {
            if (info) {
              setStorageInfo(info)
            }
          })
          .catch((error: any) => {
            console.error('Failed to save DID identities:', error)
          })
      } else {
        // Save legacy identities
        storageProvider.save(identities)
          .then(async () => {
            if (storageProvider.getStorageInfo) {
              const info = await storageProvider.getStorageInfo()
              setStorageInfo(info)
            }
          })
          .catch((error) => {
            console.error('Failed to save identities:', error)
          })
      }
    }
  }, [identities, didIdentities, storageProvider, didStorageProvider, isLoading, useDIDMode])

  const handleStorageTypeChange = async (type: StorageType, config?: Partial<StorageConfigType>) => {
    const confirmChange = window.confirm(
      'Changing storage type will clear current identities from the old storage. Continue?'
    )
    
    if (confirmChange) {
      await storageProvider.clear()
      const newProvider = createStorageProvider(type, config)
      setStorageProvider(newProvider)
      setStorageType(type)
      setStorageConfig(config || {})
      setIdentities([])
      setStorageInfo({})
    }
  }

  const handleDIDStorageTypeChange = async (type: DIDStorageType) => {
    const confirmChange = window.confirm(
      'Changing storage type will migrate your DID identities to the new storage. Continue?'
    )
    
    if (confirmChange) {
      // Save current identities before switching
      const currentIdentities = [...didIdentities]
      
      // Create new storage provider
      let newProvider
      switch (type) {
        case 'memory':
          newProvider = DIDStorageFactory.createMemoryStorage()
          break
        case 'localStorage':
          newProvider = DIDStorageFactory.createLocalStorage()
          break
        case 'sessionStorage':
          newProvider = DIDStorageFactory.createSessionStorage()
          break
        case 'indexedDB':
          newProvider = DIDStorageFactory.createIndexedDBStorage()
          break
        case 'hybrid':
          // Create hybrid with localStorage and IndexedDB
          newProvider = DIDStorageFactory.createHybridStorage([
            DIDStorageFactory.createLocalStorage(),
            DIDStorageFactory.createIndexedDBStorage()
          ])
          break
        default:
          newProvider = DIDStorageFactory.createLocalStorage()
      }
      
      // Clear old storage
      await didStorageProvider.clear()
      
      // Set new provider and type
      setDidStorageProvider(newProvider)
      setDidStorageType(type)
      
      // Migrate identities to new storage
      if (currentIdentities.length > 0) {
        await newProvider.save(currentIdentities)
      }
    }
  }

  const handleIdentityCreated = async (identity: Identity) => {
    if (useDIDMode) {
      try {
        // Create DID identity using mock service for browser compatibility
        const didIdentity = await MockDIDService.createDIDIdentity(
          identity.name,
          identity.attributes
        )
        setDidIdentities([...didIdentities, didIdentity])
      } catch (error) {
        console.error('Failed to create DID identity:', error)
        // Fallback to legacy mode
        setIdentities([...identities, identity])
      }
    } else {
      setIdentities([...identities, identity])
    }
  }

  const handleDeleteIdentity = (id: string) => {
    if (useDIDMode) {
      setDidIdentities(didIdentities.filter(identity => identity.id !== id))
    } else {
      setIdentities(identities.filter(identity => identity.id !== id))
    }
  }

  const handleUpdateIdentity = (updatedIdentity: DIDIdentity) => {
    setDidIdentities(didIdentities.map(identity => 
      identity.id === updatedIdentity.id ? updatedIdentity : identity
    ))
  }

  const handleModeToggle = () => {
    const confirmChange = window.confirm(
      'Switching between legacy and DID modes will clear current session. Continue?'
    )
    
    if (confirmChange) {
      setUseDIDMode(!useDIDMode)
      setIdentities([])
      setDidIdentities([])
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Anonymous Identity Manager</h1>
        <div className="mode-toggle">
          <label>
            <input 
              type="checkbox" 
              checked={useDIDMode} 
              onChange={handleModeToggle}
            />
            Use DID/VC Mode (New)
          </label>
        </div>
      </header>
      <main className="app-main">
        <div className="container">
          {!useDIDMode ? (
            <StorageConfig 
              currentType={storageType} 
              onTypeChange={handleStorageTypeChange}
              storageInfo={storageInfo}
              isDIDMode={false}
            />
          ) : (
            <DIDStorageConfig
              currentType={didStorageType}
              onTypeChange={handleDIDStorageTypeChange}
              storageStats={{
                identityCount: didIdentities.length,
                credentialCount: didIdentities.reduce((acc, id) => acc + id.credentials.length, 0),
                lastSync: new Date()
              }}
            />
          )}
          <IdentityCreator onIdentityCreated={handleIdentityCreated} />
          <IdentityList 
            identities={useDIDMode ? [] : identities}
            didIdentities={useDIDMode ? didIdentities : []}
            useDIDMode={useDIDMode}
            onDelete={handleDeleteIdentity}
            onUpdate={handleUpdateIdentity}
          />
        </div>
      </main>
    </div>
  )
}

export default App