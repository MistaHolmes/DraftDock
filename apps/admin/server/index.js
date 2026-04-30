require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
// SQLite removed — admin auth uses hardcoded credentials via JWT

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Serve static HTML pages from admin/ root
app.use(express.static(path.join(__dirname, '..')));

// Export prisma for route files
app.locals.prisma = prisma;

const { verifyToken } = require('./middleware/auth');

// ── Mount API routes ─────────────────────────────────────────────────────────────
// Auth route is public
app.use('/api/admin/auth', require('./routes/auth'));

// Protected admin routes
app.use('/api/admin/stats', verifyToken, require('./routes/stats'));
app.use('/api/admin/content', verifyToken, require('./routes/content'));
app.use('/api/admin/users', verifyToken, require('./routes/users'));
app.use('/api/admin/analytics', verifyToken, require('./routes/analytics'));
app.use('/api/admin/check', verifyToken, require('./routes/admin-check'));

// Redirect root to dashboard
app.get('/', (req, res) => res.redirect('/dashboard.html'));

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  🚀 Admin server running at http://localhost:${PORT}`);
  console.log(`  📄 Dashboard: http://localhost:${PORT}/dashboard.html\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = { prisma };
