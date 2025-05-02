# Dockerfile for apps/backend (NestJS)

# ---- Base ----
# Use a specific Node.js version based on project requirements
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ---- Builder ----
FROM base AS builder
WORKDIR /app

# Copy Turborepo config and root package files first for caching
COPY turbo.json turbo.json
COPY pnpm-workspace.yaml pnpm-workspace.yaml
COPY .npmrc .npmrc
COPY package.json package.json

# Install all workspace dependencies (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile --prefer-offline

# Copy source code for all packages and apps required for the build
# Adjust these paths based on actual dependencies of apps/backend
COPY . .

# Build the specific application (apps/backend)
# This leverages Turborepo's build system
RUN pnpm turbo run build --filter=backend...

# ---- Pruner ----
# Use pnpm deploy to prune development dependencies
FROM builder AS pruner
WORKDIR /app
RUN pnpm deploy --filter=backend ./deploy/backend

# ---- Runner ----
FROM base AS runner
WORKDIR /app

# Set NODE_ENV environment variable
ENV NODE_ENV production

# Copy pruned dependencies and built artifacts from the pruner stage
COPY --from=pruner /app/deploy/backend/dist /app/dist
COPY --from=pruner /app/deploy/backend/node_modules /app/node_modules
COPY --from=pruner /app/deploy/backend/package.json /app/package.json

# Expose the port the app runs on (adjust if different)
EXPOSE 3001

# Start the NestJS app
CMD ["node", "dist/main.js"] 