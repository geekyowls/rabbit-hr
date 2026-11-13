# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter frontend...
COPY tsconfig.json .prettierrc .prettierignore ./
COPY packages/shared packages/shared
COPY apps/frontend apps/frontend

ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_APP_URL=
ARG NEXT_PUBLIC_WEBSITE_URL=
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ARG NEXT_PUBLIC_GLITCHTIP_DSN=
ARG NEXT_PUBLIC_GLITCHTIP_ENV=
ARG NEXT_PUBLIC_OPENPANEL_DASHBOARD_CLIENT_ID=
ARG NEXT_PUBLIC_SHOW_INTEGRATION_STATUS=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_WEBSITE_URL=$NEXT_PUBLIC_WEBSITE_URL \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_PUBLIC_GLITCHTIP_DSN=$NEXT_PUBLIC_GLITCHTIP_DSN \
    NEXT_PUBLIC_GLITCHTIP_ENV=$NEXT_PUBLIC_GLITCHTIP_ENV \
    NEXT_PUBLIC_OPENPANEL_DASHBOARD_CLIENT_ID=$NEXT_PUBLIC_OPENPANEL_DASHBOARD_CLIENT_ID \
    NEXT_PUBLIC_SHOW_INTEGRATION_STATUS=$NEXT_PUBLIC_SHOW_INTEGRATION_STATUS \
    NEXT_PUBLIC_DEV_BYPASS_PERMISSIONS=false \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @boilerplate/shared build \
 && pnpm --filter frontend build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/frontend/out /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
