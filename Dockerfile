FROM node:20.18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Start the application
CMD ["npm", "start"]
# CMD ["npm", "run", "dev"]