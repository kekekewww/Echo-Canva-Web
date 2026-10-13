# syntax=docker/dockerfile:1
# Official multi-platform Node 22.23.3 image, registry digest verified 2026-10-13.
FROM node:22.23.3-bookworm-slim@sha256:c3de60bf2f9dd0ac6370e6117950ff62d6e339527e7472301c9c78a017978392 AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    pnpm_config_store_dir=/pnpm/store \
    pnpm_config_enable_global_virtual_store=false \
    pnpm_config_virtual_store_dir=node_modules/.pnpm
# pnpm 11 verifies the recorded store location before `pnpm run`. Keep it
# identical for root build installs and the non-root development process.
RUN npm install --global pnpm@11.7.0 \
    && mkdir -p /pnpm/store \
    && chown node:node /pnpm/store

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile

# Development and production intentionally use separate targets.
FROM base AS development
ENV NODE_ENV=development
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
RUN mkdir -p .next && chown node:node /app .next
USER node
EXPOSE 3000
STOPSIGNAL SIGTERM
CMD ["node", "node_modules/next/dist/bin/next", "dev", "--hostname", "0.0.0.0", "--port", "3000"]

FROM dependencies AS builder
COPY . .
RUN pnpm build && node scripts/collect-runtime-licenses.mjs

# No pnpm store, source checkout, tests or untraced dependencies are copied.
FROM node:22.23.3-bookworm-slim@sha256:c3de60bf2f9dd0ac6370e6117950ff62d6e339527e7472301c9c78a017978392 AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/third-party-licenses ./third-party-licenses
COPY --chown=node:node LICENSE THIRD_PARTY_NOTICES.md ./
RUN mkdir -p .next/cache && chown node:node .next/cache
USER node
EXPOSE 3000
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health',{signal:AbortSignal.timeout(4000)}).then(async r=>{if(!r.ok||(await r.json()).status!=='ok')process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
