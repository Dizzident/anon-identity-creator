# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start the development server on port 3000
- `npm run build` - Build the production version
- `npm run typecheck` - Run TypeScript type checking
- `npm run preview` - Preview the production build locally
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Architecture

This is a React/TypeScript web application for creating and managing anonymous identities using the `anon-identity` npm package.

### Key Components:
- **App.tsx**: Main application component that manages the state of all identities
- **IdentityCreator**: Form component for creating new identities with public/private key pairs
- **IdentityList**: Container component that displays all created identities
- **IdentityCard**: Individual identity display component with key visibility toggle and copy functionality

### Technology Stack:
- React 19 with TypeScript
- Vite for build tooling
- Web Crypto API for cryptographic key generation (wrapped in src/utils/crypto.ts)
- CSS for styling
- Jest and React Testing Library for unit tests
- GitHub Actions for CI/CD

The application uses browser's crypto.randomUUID() for generating unique IDs and stores identities in React state (no persistence). Key generation uses Web Crypto API with ECDSA P-256 curves, with a fallback to random bytes for demo purposes.