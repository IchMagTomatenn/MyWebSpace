# syntax=docker/dockerfile:1.6

# ---- Stage 1: build the static site with Node/Astro ----
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the project and build the static output into ./dist.
COPY . .
RUN npm run build


# ---- Stage 2: serve the static files with Caddy ----
FROM caddy:2-alpine AS runtime

# Railway injects a PORT env var; Caddy listens on it.
ENV PORT=8080 \
    CADDY_GLOBAL_OPTIONS=""

# Astro writes its static output to ./dist by default.
COPY --from=build /app/dist /site
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 8080

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
