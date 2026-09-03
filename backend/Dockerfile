# Build context is the REPO ROOT, not backend/ - scripts/migrate.ts resolves
# ../../db/migrations, so the image needs db/ as well as backend/.
#   docker build -f backend/Dockerfile .
#
# node:22-slim, not alpine: the backend runs TypeScript directly through
# --experimental-strip-types, which needs Node 22+, and glibc avoids the musl
# native-binary surprises for no meaningful size win at this scale.
FROM node:22-slim

RUN corepack enable
WORKDIR /app

# Manifests first so a source-only edit does not re-run the install layer.
# Both workspace package.json files are copied: pnpm resolves the whole
# workspace even when --filter narrows what it installs.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --filter @udyam-sathi/backend...

COPY backend/ backend/
# The migration runner reads these at runtime; without them `pnpm migrate`
# inside the container finds an empty directory and silently applies nothing.
COPY db/migrations/ db/migrations/

WORKDIR /app/backend
EXPOSE 4000

# No .env.local in the image (.dockerignore drops it). Configuration arrives
# from compose at runtime, so one image serves every environment.
CMD ["pnpm", "start"]

