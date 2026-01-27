# ==================================================================
# Luanti Learning Universe - Multi-Architecture Dockerfile
# ==================================================================
# Unterstützt: AMD64 (Intel/AMD) und ARM64 (Apple Silicon, Raspberry Pi)
# Build: docker buildx build --platform linux/amd64,linux/arm64 -t llu:latest .
# ==================================================================

# Verwende offizielle Multi-Arch Base Images
ARG DIRECTUS_VERSION=11
ARG NODE_VERSION=20-alpine

# ==================================================================
# Build Stage (Optional - für Custom Extensions)
# ==================================================================
FROM node:${NODE_VERSION} AS builder

WORKDIR /build

# Copy Extension Source
COPY backend/extensions ./extensions

# Build Extensions (falls TypeScript/Build-Step nötig)
# RUN npm install && npm run build

# ==================================================================
# Runtime Stage
# ==================================================================
FROM directus/directus:${DIRECTUS_VERSION}

# Platform Info für Debugging
ARG TARGETPLATFORM
ARG BUILDPLATFORM
RUN echo "Building for ${TARGETPLATFORM} on ${BUILDPLATFORM}"

# Copy Bootstrap Script
COPY backend/bootstrap.sh /directus/bootstrap.sh
RUN chmod +x /directus/bootstrap.sh

# Copy Extensions (falls gebaut)
# COPY --from=builder /build/extensions /directus/extensions

# Set Entrypoint
ENTRYPOINT ["/directus/bootstrap.sh"]

# Health Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8055/server/health || exit 1

# Labels
LABEL maintainer="your-email@example.com"
LABEL description="Luanti Learning Universe - Multi-Architecture"
LABEL org.opencontainers.image.source="https://github.com/StRo17/luanti-learning-universe"