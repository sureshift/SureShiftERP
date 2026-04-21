# ── Stage 1: Build ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --silent

COPY . .

# Injected at build time from docker-compose args
ARG VITE_PB_URL=https://pb.sureshift.in
ENV VITE_PB_URL=${VITE_PB_URL}

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
