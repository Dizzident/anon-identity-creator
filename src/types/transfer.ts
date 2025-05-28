import { Identity } from './identity'

export interface IdentityTransferData {
  version: string
  timestamp: number
  identity: {
    id: string
    name: string
    publicKey: string
    privateKey: string
    createdAt: string
    attributes: Record<string, any>
  }
  transferInfo: {
    transferId: string
    sourceApp: string
    targetApp: string
  }
  security: {
    checksum: string
  }
}

export function createTransferData(identity: Identity): IdentityTransferData {
  const transferId = crypto.randomUUID()
  const timestamp = Date.now()
  
  const transferData: IdentityTransferData = {
    version: '1.0.0',
    timestamp,
    identity: {
      id: identity.id,
      name: identity.name,
      publicKey: identity.publicKey,
      privateKey: identity.privateKey,
      createdAt: typeof identity.createdAt === 'string' ? identity.createdAt : identity.createdAt.toISOString(),
      attributes: identity.attributes
    },
    transferInfo: {
      transferId,
      sourceApp: 'Anonymous Identity Creator',
      targetApp: 'Mobile App'
    },
    security: {
      checksum: '' // Will be calculated
    }
  }
  
  // Calculate checksum
  const dataForChecksum = JSON.stringify({
    ...transferData,
    security: { checksum: '' }
  })
  transferData.security.checksum = generateChecksum(dataForChecksum)
  
  return transferData
}

function generateChecksum(data: string): string {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}