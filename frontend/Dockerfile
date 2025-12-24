# frontend/Dockerfile

# NodeJs based image
FROM node:20-alpine

#the working directory inside the container
WORKDIR /app

# Copy package files first (to cache dependencies)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest frontend code
COPY . .

# Expose the port React app runs on
EXPOSE 3000

# The command to start the app
CMD ["npm", "run", "dev"]