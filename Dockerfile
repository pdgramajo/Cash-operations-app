# # Build stage
# FROM node:20-alpine AS builder

# WORKDIR /app

# COPY package.json pnpm-lock.yaml ./
# RUN corepack enable && pnpm install --frozen-lockfile

# COPY . .
# RUN pnpm build

# # Serve stage
# FROM nginx:alpine

# COPY --from=builder /app/dist /usr/share/nginx/html
# COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]
# ===============================
# Stage 1 - Build
# ===============================
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencias del sistema (si alguna lib las necesita)
RUN apk add --no-cache libc6-compat

# Activar pnpm
RUN corepack enable

# Copiar archivos de dependencias primero (mejor cache)
COPY package.json pnpm-lock.yaml ./

# Instalar deps
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Build producción
ENV NODE_ENV=production
RUN pnpm build


# ===============================
# Stage 2 - Runtime
# ===============================
FROM nginx:1.27-alpine

# Seguridad básica
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Limpiar html default
RUN rm -rf /usr/share/nginx/html/*

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Config nginx custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Permisos
RUN chown -R appuser:appgroup /usr/share/nginx/html \
    && chown -R appuser:appgroup /var/cache/nginx \
    && chown -R appuser:appgroup /var/run \
    && chown -R appuser:appgroup /etc/nginx/conf.d

USER appuser

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost || exit 1

CMD ["nginx", "-g", "daemon off;"]