import { useState, useEffect } from 'react'
import IdentityCreator from './components/IdentityCreator'
import IdentityList from './components/IdentityList'
import { StorageConfig } from './components/StorageConfig'
import { Identity } from './types/identity'
import { StorageType } from './types/storage'
import { createStorageProvider } from './utils/storage'
import './App.css'

function App() {
  const [identities, setIdentities] = useState<Identity[]>([])
  const [storageType, setStorageType] = useState<StorageType>('memory')
  const [storageProvider, setStorageProvider] = useState(() => createStorageProvider('memory'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadIdentities = async () => {
      try {
        const loaded = await storageProvider.load()
        setIdentities(loaded)
      } catch (error) {
        console.error('Failed to load identities:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadIdentities()
  }, [storageProvider])

  useEffect(() => {
    if (!isLoading) {
      storageProvider.save(identities).catch((error) => {
        console.error('Failed to save identities:', error)
      })
    }
  }, [identities, storageProvider, isLoading])

  const handleStorageTypeChange = async (type: StorageType) => {
    const confirmChange = window.confirm(
      'Changing storage type will clear current identities from the old storage. Continue?'
    )
    
    if (confirmChange) {
      await storageProvider.clear()
      const newProvider = createStorageProvider(type)
      setStorageProvider(newProvider)
      setStorageType(type)
      setIdentities([])
    }
  }

  const handleIdentityCreated = (identity: Identity) => {
    setIdentities([...identities, identity])
  }

  const handleDeleteIdentity = (id: string) => {
    setIdentities(identities.filter(identity => identity.id !== id))
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Anonymous Identity Manager</h1>
      </header>
      <main className="app-main">
        <div className="container">
          <StorageConfig 
            currentType={storageType} 
            onTypeChange={handleStorageTypeChange} 
          />
          <IdentityCreator onIdentityCreated={handleIdentityCreated} />
          <IdentityList 
            identities={identities} 
            onDelete={handleDeleteIdentity}
          />
        </div>
      </main>
    </div>
  )
}

export default App