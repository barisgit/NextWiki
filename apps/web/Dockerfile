# Dockerfile for apps/web (Next.js)

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
# Adjust these paths based on actual dependencies of apps/web
COPY . .

# Build the specific application (apps/web)
# This leverages Turborepo's build system
RUN pnpm turbo run build --filter=web...

# ---- Runner ----
FROM base AS runner
WORKDIR /app

# Set NODE_ENV environment variable
ENV NODE_ENV production

# Copy Turborepo config and root package files
COPY turbo.json turbo.json
COPY pnpm-workspace.yaml pnpm-workspace.yaml
COPY .npmrc .npmrc
COPY package.json package.json

# Install ONLY production dependencies for the entire workspace
# This might install more than needed, but simpler for monorepo setup
# Alternatively, copy only the necessary node_modules from the builder stage
RUN pnpm install --prod --frozen-lockfile --prefer-offline

# Copy the built web app and necessary dependencies from the builder stage
COPY --from=builder /app/apps/web/.next /app/apps/web/.next
COPY --from=builder /app/apps/web/public /app/apps/web/public
COPY --from=builder /app/apps/web/package.json /app/apps/web/package.json
COPY --from=builder /app/node_modules /app/node_modules
# Copy other relevant packages if needed at runtime (check dependencies)
# Example: COPY --from=builder /app/packages/ui /app/packages/ui

# Expose the port the app runs on
EXPOSE 3000

# Change to the web app directory
WORKDIR /app/apps/web

# Start the Next.js app
CMD ["pnpm", "start"] 