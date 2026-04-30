FROM oven/bun:latest

WORKDIR /app

# Install production dependencies first (uses package.json / bun.lockb if present)
COPY package.json bun.lockb* ./
RUN bun install --production

# Copy app sources
COPY . .

# Ensure folder for mounted SSH key exists
RUN mkdir -p /ec2-keys

ENV NODE_ENV=production
EXPOSE 4001

# Run the monitoring service (Bun can run TypeScript files directly)
CMD ["bun", "src/index.ts"]
