# 1. Build da aplicação React + Vite
FROM node:22-alpine AS builder

WORKDIR /app

# Copia dependências primeiro para cache do Docker
COPY package*.json ./

# Instala dependências ignorando conflito de versões de peer dependencies
RUN npm ci --legacy-peer-deps

# Copia o código fonte do projeto
COPY . .

# Executa o build de produção do Vite
RUN npm run build

# 2. Servidor de produção com Nginx leve
FROM nginx:alpine AS runner

# Copia configuração do Nginx com suporte a SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os artefatos estáticos compilados pelo Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
