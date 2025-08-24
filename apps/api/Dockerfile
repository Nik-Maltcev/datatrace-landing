FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies quickly for Railway - optimized for v1.0.1
RUN npm ci --production --no-audit --no-fund --silent --prefer-offline && npm cache clean --force

# Copy only necessary source files
COPY src/ ./src/
COPY public/ ./public/

# Expose port (Railway will override this)
EXPOSE $PORT

# Simple health check without wget dependency
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+process.env.PORT+'/health',(r)=>process.exit(r.statusCode===200?0:1))"

# Start the application
CMD ["npm", "start"]