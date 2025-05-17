# Dockerfile for apps/web (Next.js) using turbo prune

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

# Prune to only include dependencies for the 'web' app
# Generates ./out/json (package files + pruned lockfile) and ./out/full (source code)
RUN turbo prune web --docker

# ---- Installer ----
# Stage to install dependencies using the pruned monorepo structure
FROM base AS installer
WORKDIR /app

# Copy the pruned package files and lockfile
COPY --from=pruner /app/out/json/ .

# Install dependencies using the pruned lockfile
RUN pnpm install --frozen-lockfile

# Copy the pruned source code
COPY --from=pruner /app/out/full/ .

# Build the 'web' app using the pruned source and installed dependencies
# Note: If using Remote Caching, add ARG/ENV for TURBO_TEAM/TURBO_TOKEN here
RUN turbo run build --filter=web

# ---- Runner ----
# Stage to run the production application
FROM base AS runner
# Set base working directory
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user and group
# Use /home/nextjs as the home directory
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs --home /home/nextjs --shell /bin/false

# Copy standalone output files (including necessary node_modules)
# Change ownership to the nextjs user - copy to WORKDIR (/app)
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
# Copy static assets to their expected location relative to the server
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
# Copy public files
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Switch to the non-root user
USER nextjs

# WORKDIR remains /app

EXPOSE 3000

ENV PORT=3000

# Run the node server using the path relative to WORKDIR (/app)
CMD ["node", "apps/web/server.js"] 