# Anonymous Identity Creator

A web application for creating and managing anonymous identities using cryptographic key pairs.

## Features

- Generate anonymous identities with public/private key pairs
- Secure key storage with visibility toggle for private keys
- Copy keys to clipboard functionality
- Clean, modern UI
- Built with React and TypeScript

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Dizzident/anon-identitycreator.git
cd anon-identitycreator

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The application will be available at http://localhost:3000

### Build

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Web Crypto API** - Browser-native cryptographic key generation

## Security Notice

⚠️ **Important**: This application stores private keys in the browser's memory only. Keys are not persisted and will be lost when the page is refreshed. For production use, implement secure key storage solutions.

## License

ISC