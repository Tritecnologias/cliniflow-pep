# ── Stage 1: Build do frontend React + Vite ──────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# ── Stage 2: Bundle do servidor Express com esbuild ───────────────────────────
FROM node:22-alpine AS server-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY server ./server
COPY tsconfig.json ./

# Compila o servidor TypeScript para JS (bundle único)
RUN npx esbuild server/index.ts \
  --bundle \
  --platform=node \
  --target=node22 \
  --format=esm \
  --outfile=server.mjs \
  --external:pg \
  --external:dotenv

# ── Stage 3: Imagem de produção mínima ────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Apenas dependências de produção (pg + dotenv)
COPY package*.json ./
RUN npm ci --legacy-peer-deps --omit=dev

# Frontend compilado
COPY --from=builder /app/dist ./dist

# Servidor compilado
COPY --from=server-builder /app/server.mjs ./server.mjs

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "server.mjs"]
