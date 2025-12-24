# backend/Dockerfile

# NodeJs based image
FROM node:20-alpine

#the working directory inside the container
WORKDIR /app

#Copy package files first (to cache dependencies)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest backend code
COPY . .

# Expose the port  Express app runs on
EXPOSE 5000

# The command to start the app
CMD ["npm", "run", "dev"]