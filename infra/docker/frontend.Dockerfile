# Stage 1: Build stage
FROM oven/bun:1 as builder

WORKDIR /app

COPY frontend/package.json frontend/bun.lockb* ./

RUN bun install --frozen-lockfile

COPY frontend/ ./

RUN bun run build

# Stage 2: Final stage
FROM oven/bun:1

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["bun", "start"]
