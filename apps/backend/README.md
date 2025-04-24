# NextWiki - Backend Application

This directory contains the optional NestJS (using Fastify) backend application for the NextWiki project.

Its primary purpose is to provide WebSocket support for features like real-time collaboration (planned Yjs integration) for users who prefer self-hosting this capability instead of relying on external providers.

**Note:** This backend is *not* required for the core functionality of NextWiki, which resides in the `apps/web` Next.js application.

For a complete overview of the project structure, features, and setup instructions, please refer to the [root README.md](../../README.md).

## Getting Started

### Prerequisites

Ensure you have installed dependencies from the root of the monorepo:

```bash
# Run from the project root
pnpm install
```

### Running the Development Server

To run the development server for this specific application (with hot-reloading):

```bash
# Run from the project root
pnpm run dev:backend
```

### Other Commands

```bash
# Run from the project root

# Compile for production
pnpm run build:backend

# Start production build
pnpm run start:backend

# Run tests (unit & e2e)
pnpm run test:backend
```
