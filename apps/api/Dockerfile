FROM node:18-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with simplified approach for Railway
RUN npm ci --production --ignore-scripts

# Copy source code
COPY . .

# Expose port (Railway will override this)
EXPOSE $PORT

# Simplified health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/health || exit 1

# Start the application
CMD ["npm", "start"]