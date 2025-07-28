# Build stage for React frontend
FROM node:18-alpine as frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --silent || npm install --silent
COPY frontend/ ./
RUN npm run build

# Build stage for Node.js backend
FROM node:18-alpine as backend-build

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --silent || npm install --silent
COPY backend/ ./

# Final production image
FROM node:18-alpine

# Install dependencies
RUN apk --no-cache add dumb-init

# Create app directory
WORKDIR /app

# Copy backend build from the backend build stage
COPY --from=backend-build /app/backend ./backend

# Copy frontend build from the frontend build stage
COPY --from=frontend-build /app/frontend/build ./backend/public

# Install only production dependencies
WORKDIR /app/backend
RUN npm ci --only=production --silent || npm install --only=production --silent

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Use dumb-init as PID 1 manager
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"] 