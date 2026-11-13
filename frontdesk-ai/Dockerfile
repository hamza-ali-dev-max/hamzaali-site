# One container that runs everything: it builds the website, then serves it and the voice backend.
# Used by Railway and by docker-compose (VPS).

# ---- Stage 1: build the website ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Public build settings (not secrets). Override with --build-arg or your host's build variables.
ARG SITE_URL=https://frontdeskai.co.za
ARG PUBLIC_API_BASE=
ARG GOOGLE_SITE_VERIFICATION=PLACEHOLDER_GOOGLE_SITE_VERIFICATION
ENV SITE_URL=$SITE_URL PUBLIC_API_BASE=$PUBLIC_API_BASE GOOGLE_SITE_VERIFICATION=$GOOGLE_SITE_VERIFICATION
RUN npm run build

# ---- Stage 2: the small runtime image ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8787
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY server ./server
COPY --from=build /app/web/dist ./web/dist
USER node
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" || exit 1
CMD ["node", "server/index.js"]
