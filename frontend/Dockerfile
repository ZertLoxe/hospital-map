# frontend/Dockerfile

# NodeJs based image
FROM node:18-alpine

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

#the working directory inside the container
WORKDIR /app

# Copy package files first (to cache dependencies)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest frontend code (use .dockerignore to exclude sensitive files)
COPY src/ ./src/
COPY public/ ./public/
COPY next.config.ts tsconfig.json postcss.config.mjs next-env.d.ts ./

# Set proper permissions (read-only for app files)
RUN chown -R nodejs:nodejs /app && chmod -R 555 /app/src /app/public

# Switch to non-root user
USER nodejs

# Expose the port React app runs on
EXPOSE 3000

# The command to start the app
CMD ["npm", "run", "dev"]