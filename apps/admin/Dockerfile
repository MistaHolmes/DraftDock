FROM node:20-alpine

# Set working directory to the container app root
WORKDIR /app

# 1. Copy only the server package files first to cache dependencies
COPY server/package*.json ./server/

# 2. Install dependencies for the server (this creates /app/server/node_modules)
RUN cd server && npm install

# 3. Copy the rest of the Admin app (including HTML/JS for static serving and the server code)
COPY . /app/

# 4. Generate the Prisma client
RUN cd server && npx prisma generate

# Expose port 10000 (Render's default)
EXPOSE 10000

# Optional: set environment variable inside image
ENV PORT=10000

# Start the server (which uses express static to serve /app files)
CMD ["node", "server/index.js"]
