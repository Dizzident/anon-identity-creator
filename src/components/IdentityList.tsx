import { Identity } from '../types/identity'
import IdentityCard from './IdentityCard'
import './IdentityList.css'

interface IdentityListProps {
  identities: Identity[]
  onDelete: (id: string) => void
}

function IdentityList({ identities, onDelete }: IdentityListProps) {
  return (
    <div className="identity-list">
      <h2>Your Identities</h2>
      {identities.length === 0 ? (
        <p className="empty-message">No identities created yet. Create one above!</p>
      ) : (
        <div className="identity-grid">
          {identities.map((identity) => (
            <IdentityCard
              key={identity.id}
              identity={identity}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default IdentityList