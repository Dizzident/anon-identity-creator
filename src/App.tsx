import { useState } from 'react'
import IdentityCreator from './components/IdentityCreator'
import IdentityList from './components/IdentityList'
import { Identity } from './types/identity'
import './App.css'

function App() {
  const [identities, setIdentities] = useState<Identity[]>([])

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