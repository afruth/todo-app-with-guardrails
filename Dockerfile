# syntax=docker/dockerfile:1.7

# ---------- Stage 1: web build ----------
FROM node:20.18.1-bookworm-slim AS web-build
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# ---------- Stage 2: api build ----------
FROM node:20.18.1-bookworm-slim AS api-build
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json tsconfig.json tsconfig.build.json ./
# Strip the husky-driven "prepare" script: it's a dev-machine git-hooks
# concern and would fail in the build sandbox (no .git, no husky in --omit=dev).
RUN npm pkg delete scripts.prepare && npm ci
COPY src/ ./src/
# Build excludes tests and *.test.ts to avoid pulling in tests/doubles fixtures
# that aren't shipped to the runtime image.
RUN npx tsc -p tsconfig.build.json

# ---------- Stage 3: runtime deps (prod-only) ----------
FROM node:20.18.1-bookworm-slim AS runtime-deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm pkg delete scripts.prepare && npm ci --omit=dev

# ---------- Stage 4: api runtime ----------
FROM node:20.18.1-bookworm-slim AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=runtime-deps /app/node_modules ./node_modules
COPY --from=api-build    /app/dist         ./dist
COPY package.json ./
RUN mkdir -p /app/data /app/uploads && chown -R node:node /app
USER node
EXPOSE 5600
CMD ["node", "dist/src/interface/http/main.js"]

# ---------- Stage 5: web runtime (nginx) ----------
FROM nginx:1.27-alpine AS web
COPY --from=web-build /app/web/dist /usr/share/nginx/html
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
