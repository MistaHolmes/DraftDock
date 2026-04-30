import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';

// MUST be first — loads REDIS_URL, DATABASE_URL etc.
dotenv.config();

// Shared modules (initialize redis connection on import)
import redisClient from './lib/redis';
import { initWebSocket } from './lib/websocket';
import { initCollabServer } from './lib/collabServer';
import { initScheduler } from './lib/scheduler';
import { globalLimiter } from './middleware/rateLimiter';

/** Flush all Redis keys on startup so stale cache from the previous run doesn't persist */
async function clearRedisOnStartup() {
  try {
    // Wait briefly to make sure the client has connected
    await new Promise<void>((resolve) => {
      if (redisClient.isReady) return resolve();
      redisClient.once('connect', () => resolve());
      // Timeout fallback so startup never hangs
      setTimeout(resolve, 5000);
    });
    await redisClient.flushAll();
    console.log('[Redis] Cache cleared on startup');
  } catch (err) {
    console.warn('[Redis] Could not clear cache on startup (non-fatal):', err);
  }
}

clearRedisOnStartup();

// Route modules
import blogRoutes from './routes/blogs';
import commentRoutes from './routes/comments';
import bookmarkRoutes from './routes/bookmarks';
import notificationRoutes from './routes/notifications';
import followRoutes from './routes/follow';
import userRoutes from './routes/user';
import tagRoutes from './routes/tags';
import authorRoutes from './routes/authors';
import seriesRoutes from './routes/series';
import aiRoutes from './routes/ai';
import analyticsRouter from './routes/analytics';
import messagingRoutes from './routes/messaging';
import discoveryRoutes from './routes/discovery';
import achievementsRouter from './routes/achievements';
import highlightRoutes from './routes/highlights';
import coauthorRoutes from './routes/coauthors';
import collabRoutes from './routes/collab';
import likeRoutes from './routes/likes';
import adminRoutes from './routes/admin';

// Team member routes
import abinashRouter from './routes/abinash';
import skRouter from './routes/sk';
import soumyaRouter from './routes/soumya';
import supritRouter from './routes/suprit';

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const wsPort = parseInt(process.env.WS_PORT || '3001', 10);
const collabPort = parseInt(process.env.COLLAB_PORT || '3002', 10);
const server = http.createServer(app);

// ── Middleware ────────────────────────────────────────────────────────────────
// CORS: allow requests from the frontend and support credentials.
// Be future-ready: accept configured FRONTEND_URL, common draftdock domains,
// local dev origins and any subdomain under the draftdock or abhasbehera roots.
const allowedOrigins = (() => {
  const list: string[] = [];
  if (process.env.FRONTEND_URL) list.push(process.env.FRONTEND_URL);
  // Allow local dev origins when not in production
  if (process.env.NODE_ENV !== 'production') {
    list.push('http://localhost:5173', 'http://127.0.0.1:5173');
  }
  // Add common production frontends as sensible defaults
  list.push(
    'https://draftdock.abhasbehera.in',
    'https://draftdock.in',
    'https://www.draftdock.in',
    'https://draftdocks.in',
    'https://www.draftdocks.in'
  );
  return list;
})();

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser requests like curl or server-to-server
    if (!origin) return callback(null, true);
    // Exact allow-list match
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Permit any subdomain of draftdock.in or abhasbehera.in to ease migration
    try {
      const hostname = new URL(origin).hostname.toLowerCase();
      if (hostname.endsWith('.draftdock.in') || hostname === 'draftdock.in') return callback(null, true);
      if (hostname.endsWith('.abhasbehera.in') || hostname === 'abhasbehera.in') return callback(null, true);
    } catch (err) {
      // fall through to deny
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(clerkMiddleware());
app.use(express.json({ limit: '10mb' }));
app.use(globalLimiter);

// ── WebSocket on separate port ───────────────────────────────────────────────
initWebSocket(wsPort);
initCollabServer(collabPort);
initScheduler(60000); // Check once per minute

// ── Mount Routes ─────────────────────────────────────────────────────────────

// Team member routes
app.use('/api/abinash', abinashRouter);
app.use('/api/sk', skRouter);
app.use('/api/soumya', soumyaRouter);
app.use('/api/suprit', supritRouter);

// Core feature routes
app.use('/api/blogs', blogRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/blogs', commentRoutes);        // mounts /api/blogs/:id/comments via /blog/:id
app.use('/api/user/bookmarks', bookmarkRoutes);
app.use('/api/user/notifications', notificationRoutes);
app.use('/api/user/follow', followRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRouter);
app.use('/api/messaging', messagingRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/achievements', achievementsRouter);
app.use('/api/highlights', highlightRoutes);
app.use('/api/coauthors', coauthorRoutes);
app.use('/api/collab', collabRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/admin', adminRoutes);

// ── Legacy Routes (backward compat) ─────────────────────────────────────────
import { requireAuth } from '@clerk/express';
import { syncUser } from './sync';
import prisma from './lib/prisma';
import { sendBlogPublishedEmail } from './email';
import { broadcastNotificationUpdate, invalidateUserBlogsCache, invalidatePublicBlogsCache } from './lib/websocket';

app.post('/api/create-blog', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    const { title, content, published, coverImage } = req.body;
    if (!title || !content || typeof published !== 'boolean') {
      return res.status(400).json({ message: 'Missing or invalid fields' });
    }

    const newBlog = await prisma.blog.create({
      data: { title, content, published, coverImage, authorId: user.id },
    });

    if (published) {
      await prisma.notification.create({
        data: { message: `Your blog "${title}" was successfully published.`, userId: user.id, read: false },
      });
      await broadcastNotificationUpdate(user.id);
      sendBlogPublishedEmail(user.email, title).catch((err) => console.error('Email send failed (non-fatal):', err));
    }

    await invalidatePublicBlogsCache();
    await invalidateUserBlogsCache(user.id);

    return res.status(201).json({ blog: newBlog });
  } catch (error) {
    console.error('Failed to create blog:', error);
    return res.status(500).json({ message: 'Blog creation failed', error: error instanceof Error ? error.message : String(error) });
  }
});

app.delete('/api/blogs/delete/:id', requireAuth(), async (req, res: any) => {
  const blogId = req.params.id as string;
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'User Not Authenticated' });

    const existingBlog = await prisma.blog.findFirst({ where: { id: blogId, authorId: user.id } });
    if (!existingBlog) return res.status(404).json({ error: 'Blog not found' });

    await prisma.blog.delete({ where: { id: blogId } });

    try {
      await invalidateUserBlogsCache(user.id);
      await redisClient.del(`blog:${blogId}`);
      await invalidatePublicBlogsCache();
    } catch (cacheErr) {
      console.warn('Redis cache invalidation failed:', cacheErr);
    }

    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (err) {
    console.error('Delete blog error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.patch('/api/draft/publish/:id', requireAuth(), async (req, res: any) => {
  const blogId = req.params.id as string;
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'User Not Authenticated' });

    const existingBlog = await prisma.blog.findFirst({ where: { id: blogId, authorId: user.id } });
    if (!existingBlog) return res.status(404).json({ error: 'Blog not found' });

    const updatedBlog = await prisma.blog.update({ where: { id: blogId }, data: { published: true } });

    try {
      await invalidateUserBlogsCache(user.id);
      await redisClient.del(`blog:${blogId}`);
      await invalidatePublicBlogsCache();
    } catch (cacheErr) {
      console.warn('Redis cache invalidation failed:', cacheErr);
    }

    res.status(200).json({ message: 'Draft published successfully', blog: updatedBlog });
  } catch (err) {
    console.error('Publish draft error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/redis-test', async (req, res) => {
  try {
    await redisClient.set('health', 'ok');
    const value = await redisClient.get('health');
    res.send({ redis: value });
  } catch (err) {
    console.error(err);
    res.status(500).send('Redis error');
  }
});

// ── Health & Version ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/version', (_, res) => {
  res.json({ version: '🟢 v2-modular', time: new Date().toISOString() });
});

// ── Start Server ─────────────────────────────────────────────────────────────
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
