FROM node:20-alpine

WORKDIR /app

# Install libc6-compat for SWC (Next.js compiler)
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port (documentary only, PORT env var is what matters)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
