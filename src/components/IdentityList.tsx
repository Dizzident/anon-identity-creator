import { Identity, DIDIdentity } from '../types/identity'
import IdentityCard from './IdentityCard'
import './IdentityList.css'

interface IdentityListProps {
  identities: Identity[]
  didIdentities?: DIDIdentity[]
  useDIDMode?: boolean
  onDelete: (id: string) => void
  onUpdate?: (updatedIdentity: DIDIdentity) => void
}

function IdentityList({ identities, didIdentities = [], useDIDMode = false, onDelete, onUpdate }: IdentityListProps) {
  const currentIdentities = useDIDMode ? didIdentities : identities
  const totalCount = currentIdentities.length
  
  return (
    <div className="identity-list">
      <h2>Your Identities {useDIDMode && <span className="did-badge">DID/VC Mode</span>}</h2>
      {totalCount === 0 ? (
        <p className="empty-message">
          No identities created yet. Create one above!
          {useDIDMode && <br />}<em>Using {useDIDMode ? 'DID/VC' : 'Legacy'} mode</em>
        </p>
      ) : (
        <div className="identity-grid">
          {useDIDMode ? (
            didIdentities.map((identity) => (
              <IdentityCard
                key={identity.id}
                identity={identity}
                useDIDMode={true}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))
          ) : (
            identities.map((identity) => (
              <IdentityCard
                key={identity.id}
                identity={identity}
                useDIDMode={false}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default IdentityList