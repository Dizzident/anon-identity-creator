# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start the development server on port 3000
- `npm run build` - Build the production version
- `npm run typecheck` - Run TypeScript type checking
- `npm run preview` - Preview the production build locally

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
- anon-identity package for cryptographic identity generation
- CSS modules for styling

The application uses browser's crypto.randomUUID() for generating unique IDs and stores identities in React state (no persistence).