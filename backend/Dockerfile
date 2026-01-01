# backend/Dockerfile

# NodeJs based image
FROM node:18-alpine

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

#the working directory inside the container
WORKDIR /app

#Copy package files first (to cache dependencies)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest backend code (use .dockerignore to exclude sensitive files)
COPY src/ ./src/
COPY tsconfig.json ./

# Set proper permissions (read-only for app files)
RUN chown -R nodejs:nodejs /app && chmod -R 555 /app/src

# Switch to non-root user
USER nodejs

# Expose the port  Express app runs on
EXPOSE 5000

# The command to start the app
CMD ["npm", "run", "dev"]