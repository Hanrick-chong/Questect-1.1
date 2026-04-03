# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Run
FROM node:20-slim

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --production

# Copy build artifacts and config
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

# Expose port and start
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
