# Stage 1: Build the Next.js static files
FROM oven/bun:1 AS builder

WORKDIR /app

COPY frontend/package.json frontend/bun.lockb* ./

RUN bun install --frozen-lockfile

COPY frontend/ ./

# NEXT_PUBLIC_API_BASE_URL defaults to /api so nginx can proxy to the backend
ARG NEXT_PUBLIC_API_BASE_URL=/api
ARG NEXT_PUBLIC_WS_BASE_URL=/ws
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_WS_BASE_URL=${NEXT_PUBLIC_WS_BASE_URL}

RUN bun run build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/out /usr/share/nginx/html
COPY infra/nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
