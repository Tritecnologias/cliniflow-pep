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

# Compila o servidor TypeScript para JS (mantém dependências externas para usar node_modules)
RUN npx esbuild server/index.ts \
  --bundle \
  --platform=node \
  --target=node22 \
  --format=esm \
  --outfile=server.mjs \
  --packages=external

# ── Stage 3: Imagem de produção mínima ────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Apenas dependências de produção (pg, express, cors, dotenv)
COPY package*.json ./
RUN npm ci --legacy-peer-deps --omit=dev

# Frontend compilado
COPY --from=builder /app/dist ./dist

# Servidor compilado
COPY --from=server-builder /app/server.mjs ./server.mjs

# Expõe as portas 80 (padrão Coolify/Traefik) e 3001
EXPOSE 80
EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=80

CMD ["node", "server.mjs"]
