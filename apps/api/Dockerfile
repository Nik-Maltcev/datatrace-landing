FROM node:18-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with timeout and retry
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --production --prefer-offline || npm install --production

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S datatrace -u 1001

# Change ownership
RUN chown -R datatrace:nodejs /app
USER datatrace

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "start"]