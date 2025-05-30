# Getting Started Guide

## 🎯 Overview

This guide will help you get the Anonymous Identity Creator up and running, understand its key features, and start using it effectively for identity management. Whether you're a developer looking to integrate the system or a user wanting to understand the application, this guide provides everything you need to get started.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher
- **npm** 8.0 or higher (or yarn 1.22+)
- A modern browser with Web Crypto API support:
  - Chrome 60+
  - Firefox 57+
  - Safari 11+
  - Edge 79+

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd anon-identitycreator
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to `http://localhost:5173` (or the port shown in your terminal)

### Build for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## 🎮 First Steps

### 1. Understanding the Interface

When you first open the application, you'll see:

- **Header**: Contains the application title and mode toggle
- **Mode Toggle**: Switch between Legacy and DID/VC modes
- **Main Content**: Different based on selected mode and tab

### 2. Choosing Your Mode

The application offers two modes:

#### Legacy Mode
- Simple key-pair based identities
- Basic attribute storage
- Compatible with older systems
- Good for learning and simple use cases

#### DID/VC Mode (Recommended)
- W3C-compliant Decentralized Identifiers
- Verifiable Credentials
- Advanced privacy features
- Full-featured identity management

**💡 Tip:** Start with DID/VC mode for the complete experience!

### 3. Your First Identity

Let's create your first identity:

1. **Ensure DID/VC mode is enabled** (toggle in header)
2. **Navigate to the Identities tab** (👤 icon)
3. **Fill out the identity creation form:**
   - **Name**: Enter a display name for your identity
   - **Basic Profile**: Add personal information (all optional)
   - **Contact Information**: Add contact details (all optional)
4. **Click "Create Identity"**

Congratulations! You've created your first DID-based identity with verifiable credentials.

## 📱 Interface Overview

### Header Navigation (DID Mode)

The header contains three main tabs when in DID mode:

#### 👤 Identities Tab
- Create new identities
- View and manage existing identities
- Configure storage settings
- Access privacy features

#### 🏢 Service Provider Tab
- Verify credentials from others
- Create verification requests
- Manage verification history
- Batch verification capabilities

#### 🔐 Sessions Tab
- Create secure sharing sessions
- Monitor active sessions
- Manage session lifecycle
- Track session statistics

### Storage Configuration

Choose from multiple storage options:

- **Memory**: Fast, temporary (development)
- **Local Storage**: Persistent browser storage
- **Session Storage**: Tab-scoped storage
- **IndexedDB**: Advanced browser database
- **Hybrid**: Multiple backend redundancy

## 🎯 Key Features Walkthrough

### 1. Identity Management

#### Creating Identities
- Fill optional form fields based on your needs
- All attributes are stored as verifiable credentials
- Cryptographic keys are generated automatically
- Each identity gets a unique DID

#### Managing Identities
- View all your identities in a grid layout
- Expand cards to see detailed information
- Copy important data (DIDs, keys) to clipboard
- Delete identities when no longer needed

### 2. Privacy Features

#### Selective Disclosure
1. **Open an identity card**
2. **Click "Selective Disclosure"**
3. **Select which attributes to share**
4. **Generate a privacy-preserving presentation**
5. **Export or share the presentation**

#### QR Code Sharing
1. **Click "Share via QR Code" on any identity**
2. **Choose your sharing mode:**
   - **Full Transfer**: Complete identity (use carefully!)
   - **Verifiable Presentation**: Cryptographically signed credentials
   - **Selective Disclosure**: Only chosen attributes
3. **Generate and share the QR code**

### 3. Credential Management

#### Viewing Credentials
- Each DID identity contains verifiable credentials
- Credentials store your attributes with cryptographic proofs
- View credential details in the Credential Manager

#### Adding Credentials
1. **Open Credential Manager from an identity card**
2. **Click "Add New Credential"**
3. **Fill in the attribute form**
4. **Save the new credential**

### 4. Service Provider Features

#### Verifying Credentials
1. **Switch to the Service Provider tab** (🏢)
2. **Configure verifier details**
3. **Select identities to verify**
4. **Choose verification mode** (Single or Batch)
5. **Run verification and view results**

#### Managing Sessions
1. **Switch to the Sessions tab** (🔐)
2. **Click "Create New Session"**
3. **Configure session parameters**
4. **Monitor active sessions**
5. **Extend or terminate sessions as needed**

## 🔧 Configuration Options

### Storage Configuration

**Memory Storage:**
- ✅ Fast access
- ❌ No persistence

**Local Storage:**
- ✅ Persists data
- ✅ Simple and reliable
- ❌ ~10MB limit

**IndexedDB:**
- ✅ Large storage capacity
- ✅ Structured data support
- ❌ More complex

**Hybrid Storage:**
- ✅ Best reliability
- ✅ Redundancy
- ❌ Slightly slower

### Privacy Settings

**QR Code Security Levels:**
- **Full Transfer**: Highest risk, complete access
- **Presentation**: Medium risk, verified credentials only
- **Selective**: Lowest risk, minimal data exposure

## 🔍 Understanding DIDs and VCs

### What is a DID?
A Decentralized Identifier (DID) is a new type of identifier that:
- Is globally unique
- Can be verified cryptographically
- Is under the control of the DID subject
- Works without requiring a centralized registry

**Example DID:**
```
did:example:123456789abcdefghi
├── "did" - the scheme
├── "example" - the method
└── "123456789abcdefghi" - the unique identifier
```

### What is a Verifiable Credential?
A Verifiable Credential (VC) is a digital credential that:
- Contains claims about a subject
- Is cryptographically signed by an issuer
- Can be verified without contacting the issuer
- Preserves privacy when shared

**Credential Structure:**
```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "id": "credential-123",
  "type": ["VerifiableCredential"],
  "credentialSubject": {
    "id": "did:example:123",
    "givenName": "Alice",
    "familyName": "Smith"
  },
  "issuer": "did:example:issuer",
  "issuanceDate": "2023-01-01T00:00:00Z",
  "proof": { ... }
}
```

## 🛡️ Security Best Practices

### 1. Key Management
- Never share private keys
- Use secure storage options for production
- Regularly backup important identities
- Consider using session storage for temporary work

### 2. Credential Sharing
- Use selective disclosure when possible
- Prefer verifiable presentations over full transfers
- Verify the purpose before sharing credentials
- Check recipient identity before sharing

### 3. Session Management
- Set appropriate session durations
- Terminate unused sessions
- Monitor session activity regularly
- Use meaningful session names

## 🧪 Testing Your Setup

### 1. Basic Functionality Test
1. Create a test identity
2. Add some attributes
3. Generate a QR code
4. Verify the identity appears in your list

### 2. Privacy Features Test
1. Create an identity with multiple attributes
2. Use selective disclosure to share only some attributes
3. Verify only selected attributes appear in the presentation

### 3. Service Provider Test
1. Create multiple identities
2. Switch to Service Provider tab
3. Verify credentials using batch mode
4. Check verification results

## 🐛 Troubleshooting

### Common Issues

**Application won't start:**
- Check Node.js version (18+)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

**Browser compatibility issues:**
- Ensure Web Crypto API support
- Try a different modern browser
- Check for HTTPS requirement (for some features)

**Storage issues:**
- Clear browser storage if corruption suspected
- Try different storage backend
- Check available storage space

**QR codes not generating:**
- Check browser console for errors
- Ensure identity has required data
- Try refreshing the page

### Getting Help

1. **Check the console** for error messages
2. **Review the documentation** for specific features
3. **Test with a fresh browser profile** to rule out extensions
4. **Try different storage backends** if data issues persist

## 📚 Next Steps

Once you're comfortable with the basics:

1. **Explore Advanced Features:**
   - Read the [DID/VC Concepts Guide](did-vc-concepts.md)
   - Learn about [Implementation Details](implementation-guide.md)
   - Check out [Advanced Scenarios](../examples/advanced-scenarios.md)

2. **Integration:**
   - Review the [API Documentation](../api/service-provider-api.md)
   - Study [Integration Examples](../examples/integration-examples.md)
   - Understand the [Component Architecture](../components/component-overview.md)

3. **Development:**
   - Set up your development environment
   - Read the [Type Definitions](../types/identity-types.md)
   - Explore the [Service Documentation](../services/mock-did-service.md)

## 💡 Tips for Success

1. **Start Simple**: Begin with basic identities and gradually explore advanced features
2. **Understand Privacy**: Learn when to use different sharing modes
3. **Practice Security**: Always verify before sharing sensitive information
4. **Experiment Safely**: Use memory storage for testing and experimentation
5. **Read Documentation**: Each feature has detailed documentation available

Welcome to the world of decentralized identity management! 🎉