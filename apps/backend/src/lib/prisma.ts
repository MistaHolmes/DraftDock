import { PrismaClient } from '@prisma/client';

// Append Prisma connection pool params to DATABASE_URL if not already present.
// This prevents P2024 "Timed out fetching a new connection from the connection pool" errors.
// connection_limit=5 keeps it low because Neon pooler already manages connections.
// pool_timeout=30 gives 30s (vs default 10s) to acquire a connection.
const rawUrl = process.env.DATABASE_URL || '';
if (rawUrl && !rawUrl.includes('connection_limit')) {
  const sep = rawUrl.includes('?') ? '&' : '?';
  process.env.DATABASE_URL = `${rawUrl}${sep}connection_limit=5&pool_timeout=30`;
}

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Graceful shutdown - close Prisma connections
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
