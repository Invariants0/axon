FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ ./

# Build the Next.js application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY frontend/package.json frontend/package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
