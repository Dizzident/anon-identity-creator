# Component Overview

## 🎯 Overview

This document provides a comprehensive overview of all React components in the Anonymous Identity Creator application. Components are organized by functionality and responsibility within the system architecture.

## 🏗️ Component Hierarchy

```
App.tsx (Root Component)
├── Header Controls
│   ├── Mode Toggle (Legacy/DID)
│   └── Tab Navigation (DID Mode)
│       ├── 👤 Identities Tab
│       ├── 🏢 Service Provider Tab
│       └── 🔐 Sessions Tab
├── Storage Configuration
│   ├── StorageConfig (Legacy Mode)
│   └── DIDStorageConfig (DID Mode)
├── Identity Management
│   ├── IdentityCreator
│   ├── IdentityList
│   │   └── IdentityCard[]
│   │       ├── QRCodeModal
│   │       ├── CredentialManager (DID Mode)
│   │       └── SelectiveDisclosure (DID Mode)
├── Service Provider Interface
│   └── ServiceProvider
└── Session Management
    └── SessionManager
```

## 🧩 Core Components

### 1. App.tsx
**Purpose:** Root application component managing global state and routing
**Responsibility:** 
- Application state management
- Mode switching (Legacy/DID)
- Tab navigation for DID mode
- Storage provider management

**Key Features:**
- Dual-mode architecture support
- Global state management
- Storage provider switching
- Tab-based navigation

**Props:** None (root component)

**State:**
```typescript
- identities: Identity[]
- didIdentities: DIDIdentity[]
- useDIDMode: boolean
- currentTab: 'identities' | 'verify' | 'sessions'
- storageType: StorageType
- didStorageType: DIDStorageType
```

---

## 📱 Identity Management Components

### 2. IdentityCreator.tsx
**Purpose:** Form component for creating new identities
**Responsibility:** 
- Identity creation form handling
- Field validation and submission
- DID/VC credential generation
- Attribute collection and processing

**Key Features:**
- Comprehensive form with validation
- Configurable schema fields
- DID mode integration
- Real-time validation

**Props:**
```typescript
interface IdentityCreatorProps {
  onIdentityCreated: (identity: Identity) => void
}
```

**Form Fields:**
- Basic Profile: Name, Date of Birth, Age Verification, Nationality, Occupation
- Contact Information: Email, Phone, Address Components
- All fields are optional with proper validation

---

### 3. IdentityList.tsx
**Purpose:** Container component displaying all created identities
**Responsibility:**
- Identity grid layout management
- Mode-specific display logic
- Empty state handling
- Identity filtering and sorting

**Key Features:**
- Responsive grid layout
- Mode-aware display (Legacy/DID)
- Empty state messaging
- Identity count display

**Props:**
```typescript
interface IdentityListProps {
  identities: Identity[]
  didIdentities: DIDIdentity[]
  useDIDMode: boolean
  onDelete: (id: string) => void
  onUpdate: (identity: DIDIdentity) => void
}
```

---

### 4. IdentityCard.tsx
**Purpose:** Individual identity display component
**Responsibility:**
- Single identity presentation
- Action buttons (Edit, Delete, Share)
- Credential display (DID mode)
- Privacy controls

**Key Features:**
- Collapsible attribute sections
- Copy functionality for key data
- QR code generation trigger
- Privacy-aware display

**Props:**
```typescript
interface IdentityCardProps {
  identity: Identity | DIDIdentity
  useDIDMode: boolean
  onDelete: (id: string) => void
  onUpdate?: (identity: DIDIdentity) => void
}
```

**Key Interactions:**
- Click to expand/collapse details
- Copy buttons for sensitive data
- Modal triggers for sharing and management

---

## 🔐 Privacy & Credential Components

### 5. SelectiveDisclosure.tsx
**Purpose:** Privacy-preserving attribute selection component
**Responsibility:**
- Attribute selection interface
- Presentation generation
- Privacy control management
- Selective disclosure creation

**Key Features:**
- Checkbox-based attribute selection
- Select all/none functionality
- Real-time presentation preview
- Export capabilities

**Props:**
```typescript
interface SelectiveDisclosureProps {
  identity: DIDIdentity
  onPresentationCreated: (presentation: MockVerifiablePresentation) => void
}
```

**Workflow:**
1. Display available attributes from credentials
2. Allow user selection of specific attributes
3. Generate selective disclosure presentation
4. Provide export/sharing options

---

### 6. CredentialManager.tsx
**Purpose:** Comprehensive credential lifecycle management
**Responsibility:**
- Credential display and status checking
- New credential addition
- Credential verification and export
- Lifecycle management

**Key Features:**
- Credential list with status indicators
- Add new credentials functionality
- Export individual credentials
- Status checking and validation

**Props:**
```typescript
interface CredentialManagerProps {
  identity: DIDIdentity
  onIdentityUpdate: (identity: DIDIdentity) => void
}
```

**Credential Operations:**
- View credential details
- Add new credentials with custom attributes
- Export credentials in various formats
- Verify credential status

---

## 📤 Sharing & Transfer Components

### 7. QRCodeModal.tsx
**Purpose:** QR code generation and sharing interface
**Responsibility:**
- QR code generation for identity transfer
- Multiple transfer mode support
- Security warnings and instructions
- Export and sharing capabilities

**Key Features:**
- Three transfer modes: Full, Presentation, Selective
- Dynamic QR code generation
- Security-aware messaging
- Download and copy functionality

**Props:**
```typescript
interface QRCodeModalProps {
  identity: Identity | DIDIdentity
  isOpen: boolean
  onClose: () => void
}
```

**Transfer Modes:**
- **Full Transfer:** Complete identity with private keys
- **Verifiable Presentation:** Cryptographically signed credentials
- **Selective Disclosure:** User-selected attributes only

---

## ⚙️ Configuration Components

### 8. StorageConfig.tsx
**Purpose:** Legacy storage configuration interface
**Responsibility:**
- Storage type selection
- Configuration options management
- Storage information display
- Migration handling

**Key Features:**
- Radio button storage selection
- Configuration forms for IPFS/Blockchain
- Storage information display
- Migration confirmation dialogs

**Props:**
```typescript
interface StorageConfigProps {
  currentType: StorageType
  onTypeChange: (type: StorageType, config?: Partial<StorageConfigType>) => void
  storageInfo?: { hash?: string; txHash?: string; gateway?: string }
}
```

---

### 9. DIDStorageConfig.tsx
**Purpose:** Advanced DID storage configuration interface
**Responsibility:**
- DID-aware storage management
- Multiple backend selection
- Storage statistics display
- Hybrid storage configuration

**Key Features:**
- Visual storage option cards
- Pros/cons information
- Hybrid storage backend selection
- Storage statistics and recommendations

**Props:**
```typescript
interface DIDStorageConfigProps {
  currentType: DIDStorageType
  onTypeChange: (type: DIDStorageType) => void
  storageStats?: {
    identityCount: number
    credentialCount: number
    lastSync?: Date
  }
}
```

**Storage Types:**
- Memory: Fast, temporary storage
- LocalStorage: Persistent browser storage
- SessionStorage: Tab-scoped storage
- IndexedDB: Advanced browser database
- Hybrid: Multiple backend redundancy

---

## 🏢 Service Provider Components

### 10. ServiceProvider.tsx
**Purpose:** Credential verification interface for service providers
**Responsibility:**
- Verification configuration
- Batch and single verification
- Result display and management
- Verification history tracking

**Key Features:**
- Comprehensive verification configuration
- Single and batch verification modes
- Real-time result display
- Verification history management

**Props:**
```typescript
interface ServiceProviderProps {
  identities: DIDIdentity[]
  onVerificationComplete?: (result: VerificationResult | BatchVerificationResult) => void
}
```

**Verification Workflow:**
1. Configure verifier details
2. Select verification mode and identities
3. Execute verification process
4. Display comprehensive results
5. Track verification history

---

### 11. SessionManager.tsx
**Purpose:** Session management interface for secure credential sharing
**Responsibility:**
- Session creation and configuration
- Session monitoring and statistics
- Session lifecycle management
- Security and expiration handling

**Key Features:**
- Session creation with configurable duration
- Real-time session monitoring
- Session status tracking
- Extension and termination controls

**Props:**
```typescript
interface SessionManagerProps {
  onSessionSelected?: (session: Session) => void
}
```

**Session Management:**
- Create sessions with custom duration
- Monitor active sessions
- Track session statistics
- Handle session expiration and renewal

---

## 🎨 Component Design Patterns

### 1. Container/Presentation Pattern
- **Container Components:** Manage state and business logic (App, IdentityList)
- **Presentation Components:** Handle UI rendering (IdentityCard, forms)

### 2. Compound Component Pattern
- Complex components like CredentialManager use sub-components
- Modular design for better maintainability

### 3. Render Props Pattern
- Used for sharing stateful logic between components
- Callbacks for custom behavior injection

### 4. Higher-Order Component Pattern
- Modal management for QRCodeModal
- Common functionality abstraction

## 🔄 State Management Patterns

### 1. Prop Drilling Minimization
- Strategic state placement to minimize prop passing
- Context usage for deeply nested state

### 2. Callback Pattern
- Consistent callback patterns for component communication
- Event bubbling for complex interactions

### 3. Derived State
- Computed values from existing state
- Performance optimization with useMemo

## 🧪 Component Testing Strategy

### 1. Unit Testing
- Individual component behavior testing
- Props and state change testing
- Event handling validation

### 2. Integration Testing
- Component interaction testing
- Workflow validation
- State synchronization testing

### 3. Accessibility Testing
- Keyboard navigation support
- Screen reader compatibility
- Focus management

## 📱 Responsive Design

### 1. Mobile-First Approach
- Components designed for mobile screens first
- Progressive enhancement for larger screens

### 2. Flexible Layouts
- CSS Grid and Flexbox for responsive layouts
- Breakpoint-based design adjustments

### 3. Touch-Friendly Interfaces
- Appropriate touch targets
- Gesture support where applicable

This component architecture provides a solid foundation for identity management while maintaining flexibility, security, and user experience.