# ---------- Stage 1: Build ----------
FROM node:18-alpine as builder

WORKDIR /app

# Copy dependency files and install
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Ensure Vite picks up production mode
ENV NODE_ENV=production

# Build the project
RUN npm run build

# ---------- Stage 2: NGINX Server ----------
FROM nginx:stable-alpine

# Remove default HTML files
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Set Cloud Run-compatible NGINX config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run expects the container to listen on port 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
