# Build context is the REPO ROOT (pnpm workspace):
#   docker build -f frontend/Dockerfile .
#
# Two stages: the build stage carries the full workspace and toolchain, the
# runtime stage carries only Next's standalone output. Standalone is enabled
# here and nowhere else - see the NEXT_STANDALONE note in next.config.ts for
# why it is not the default (it does not build on Windows).

# ---------------------------------------------------------------- build
FROM node:22-slim AS build

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN pnpm install --frozen-lockfile --filter @udyam-sathi/frontend...

COPY frontend/ frontend/

# NEXT_PUBLIC_* is inlined into the client bundle at BUILD time, so these are
# build args rather than runtime env. Setting them in `environment:` would do
# nothing - the value is already baked into the JavaScript the browser gets.
#
# The default is deliberately localhost:4000, the address the BROWSER reaches
# the API on (the published host port). It must NOT be http://api:4000: that
# hostname only resolves inside the Docker network, and this fetch runs on the
# user's machine, not in the container.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_DEMO_VILLAGES=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_DEMO_VILLAGES=$NEXT_PUBLIC_DEMO_VILLAGES
ENV NEXT_STANDALONE=true

RUN pnpm --filter @udyam-sathi/frontend build

# -------------------------------------------------------------- runtime
FROM node:22-slim AS runtime

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# Standalone traces from the workspace root, so it emits the package's server
# nested under frontend/. Copying the whole tree keeps that layout intact -
# server.js resolves its own node_modules relative to itself.
COPY --from=build /app/frontend/.next/standalone/ ./
# Static assets and public/ are deliberately NOT traced into standalone; Next
# expects them copied alongside. Without these the app boots and then serves
# every page unstyled with 404s on every chunk.
COPY --from=build /app/frontend/.next/static/ ./frontend/.next/static/
COPY --from=build /app/frontend/public/ ./frontend/public/

USER node
EXPOSE 3000

CMD ["node", "frontend/server.js"]

