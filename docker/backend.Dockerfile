# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo

FROM base AS build
RUN apk add --no-cache python3 make g++
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/backend/package.json apps/backend/
COPY packages/core/package.json packages/core/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter backend...
COPY tsconfig.json ./
COPY packages packages
COPY apps/backend apps/backend
RUN pnpm --filter @boilerplate/shared build \
 && pnpm --filter @boilerplate/core build \
 && pnpm --filter backend build
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm --filter backend deploy --prod /out \
 && rm -rf /out/dist /out/src /out/test /out/scripts /out/static \
    /out/CLAUDE.md /out/eslint.config.mjs /out/webpack.config.js /out/tsconfig*.json \
 && cp -r apps/backend/dist /out/dist

FROM node:22-alpine AS runtime
RUN apk add --no-cache tini
ENV NODE_ENV=production
ENV PORT=4000
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD grep -q worker /proc/1/cmdline || wget -qO- "http://127.0.0.1:${PORT}/api/v1/health" | grep -q '"database":{"status":"up"'
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/src/main.js"]
