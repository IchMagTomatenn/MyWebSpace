# syntax=docker/dockerfile:1.6

# ---- Stage 1: build the SSR server with Node/Astro ----
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies first for better layer caching. We use `npm install`
# instead of `npm ci` because the lock file references optional, platform-
# specific packages (@emnapi/wasi-threads, cpu: wasm32) whose transitive
# deps are not resolved on x64 — `npm ci` rejects that, `npm install`
# reconciles it.
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Copy the rest of the project and build the Node server output into ./dist.
COPY . .
RUN npm run build


# ---- Stage 2: runtime (Node SSR) ----
FROM node:22-alpine AS runtime

WORKDIR /app

# Install only production dependencies (better-auth, drizzle, pg, …).
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

# Astro's Node adapter writes the entry to ./dist/server/entry.mjs.
COPY --from=build /app/dist ./dist

# Railway injects PORT; the Node adapter listens on it (default 8080).
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080

CMD ["node", "./dist/server/entry.mjs"]
