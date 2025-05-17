# Dockerfile for apps/backend (NestJS) using turbo prune

# ---- Base ----
FROM node:22-bookworm-slim AS base
# Pnpm is included via corepack in node:18+
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

# Install Turbo globally
RUN pnpm add -g turbo@latest

# ---- Pruner ----
# Stage to copy only necessary files and prune the monorepo
FROM base AS pruner
WORKDIR /app

# Copy root configs, lockfile, and turbo config first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
# Copy full source code to allow pruning
COPY . .

# Prune to only include dependencies for the 'backend' app
# Generates ./out/json (package files + pruned lockfile) and ./out/full (source code)
RUN turbo prune backend --docker

# ---- Installer ----
# Stage to install dependencies using the pruned monorepo structure
FROM base AS installer
WORKDIR /app

# Copy the pruned package files and lockfile
COPY --from=pruner /app/out/json/ .

# Install ALL dependencies needed for building
RUN pnpm install --frozen-lockfile

# Copy the pruned source code
COPY --from=pruner /app/out/full/ .

# Build the 'backend' app using the pruned source and installed dependencies
# Note: If using Remote Caching, add ARG/ENV for TURBO_TEAM/TURBO_TOKEN here
RUN turbo run build --filter=backend

# ---- Runner ----
# Stage to run the production application
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user for the backend
RUN addgroup --system --gid 1002 nodejs-backend # Use a different GID than web
RUN adduser --system --uid 1002 nestjs --home /home/nestjs --shell /bin/false

# Copy the entire built application state from the installer stage
# This includes node_modules and the dist folder
COPY --from=installer --chown=nestjs:nodejs-backend /app ./

# Switch to the non-root user
USER nestjs

# WORKDIR remains /app

# Expose default NestJS port (can be overridden by PORT env var)
EXPOSE 3001

# Start the NestJS app using the path relative to WORKDIR (/app)
CMD ["node", "apps/backend/dist/main.js"] 