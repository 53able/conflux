# Multi-stage build for optimized production image
FROM node:20-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@9.0.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build stage
FROM base AS builder
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

# Install pnpm globally
RUN npm install -g pnpm@9.0.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy scripts
COPY scripts/ ./scripts/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
  adduser -S conflux -u 1001

# Make scripts executable
RUN chmod +x ./scripts/docker-entrypoint.sh

# Change ownership of the app directory
RUN chown -R conflux:nodejs /app
USER conflux

# Health check for MCP server
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node scripts/docker-healthcheck.js || exit 1

# MCP server runs on stdio, no port needed
# Start the MCP server using entrypoint script
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]

