# Multi-stage Build für GitHub Status Tracker
FROM node:18-alpine AS base

# Installiere curl für Health Checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY server.js .
COPY database.js .
COPY github-api.js .
COPY public/ ./public/

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "server.js"]
