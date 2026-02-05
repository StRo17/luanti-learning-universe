# ============================================================
# Next.js 16 Multi-Stage Docker Build
# Optimiert für output: 'standalone'
# ============================================================

# --- Stage 1: Dependencies ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Package files kopieren
COPY package.json package-lock.json* ./

# Dependencies installieren
RUN npm ci

# --- Stage 2: Build ---
FROM node:20-alpine AS builder
WORKDIR /app

# Dependencies aus vorheriger Stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment für Build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Next.js Build (mit standalone output)
RUN npm run build

# --- Stage 3: Production Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

# Security: Nicht-root User erstellen
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Statische Assets kopieren
COPY --from=builder /app/public ./public

# Standalone Output kopieren (enthält nur benötigte node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# sharp für Image Optimization (optional aber empfohlen)
# Falls Bilder optimiert werden sollen:
# RUN npm install sharp

# User wechseln
USER nextjs

# Port freigeben
EXPOSE 3000

# App starten
CMD ["node", "server.js"]
