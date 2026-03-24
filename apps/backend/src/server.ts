import express from 'express';
import { PrismaClient } from '@prisma/client';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import dotenv from 'dotenv';
import { syncUser } from './sync';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { createClient } from 'redis';
import { sendBlogPublishedEmail } from './email';
import rateLimit from 'express-rate-limit';

// MUST be first — loads REDIS_URL, DATABASE_URL etc. before anything reads process.env
dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

redisClient.on('error', (err) => console.error('Redis client error:', err));
redisClient.on('connect', () => console.log('Redis connected'));
redisClient.on('reconnecting', () => console.log('Redis reconnecting...'));
redisClient.connect().catch(console.error);

const app = express();
const prisma = new PrismaClient();
const port = parseInt(process.env.PORT || '3000', 10);
const server = http.createServer(app);

app.use(clerkMiddleware());
app.use(cors({
  origin: true,
  credentials: true,
}));
// Use only express.json() — bodyParser.json() is redundant (express wraps it internally)
app.use(express.json());

// ── Rate Limiting ────────────────────────────────────────────────────────────
// Global limiter: 200 req / 15 min per IP (generous for public read traffic)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Strict limiter for write operations (create/update/delete/publish)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests, please slow down.' },
});

// Auth-related limiter (user sync)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests.' },
});

app.use(globalLimiter);
// ─────────────────────────────────────────────────────────────────────────────

// Store user WebSocket connections with ping/pong tracking
interface UserConnection {
  ws: WebSocket;
  isAlive: boolean;
  userId: string;
}

const userConnections = new Map<string, UserConnection>();

const wss = new WebSocketServer({ server });

const PING_INTERVAL = 30000;

// Standard Heartbeat mechanism: periodically check all connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const conn = Array.from(userConnections.values()).find(c => c.ws === ws);
    if (conn) {
      if (!conn.isAlive) {
        console.log(`User ${conn.userId} failed to respond to heartbeat, terminating connection`);
        userConnections.delete(conn.userId);
        return ws.terminate();
      }
      conn.isAlive = false;
    }
  });
}, PING_INTERVAL);

wss.on('close', () => clearInterval(interval));

wss.on('connection', (ws) => {
  // console.log('Client connected');
  let userId: string | null = null;
  let connectionData: UserConnection = { ws, isAlive: true, userId: '' };

  ws.on('pong', () => {
    if (connectionData) connectionData.isAlive = true;
  });

  ws.on('message', async (message) => {
    const data = message.toString();

    // Handle user registration for notifications
    if (data.startsWith('register:')) {
      userId = data.split(':')[1];
      connectionData.userId = userId;
      connectionData.isAlive = true;
      userConnections.set(userId, connectionData);
      // console.log(`Connected users: ${userConnections.size}`);
      
      // Send initial notification data
      try {
        const notifications = await getNotificationsForUser(userId);
        const unreadCount = notifications.filter((n:any) => !n.read).length;
        
        ws.send(JSON.stringify({
          type: 'initial_notifications',
          notifications,
          unreadCount
        }));
      } catch (error) {
        console.error('Error sending initial notifications:', error);
      }
    }

    // Handle text-level pong from client (browser sends text 'pong' in response to text 'ping')
    if (data === 'pong') {
      connectionData.isAlive = true;
      return;
    }

    // Handle text-level ping from client — respond with text 'pong'
    if (data === 'ping') {
      connectionData.isAlive = true;
      ws.send('pong');
      return;
    }

    // Get likes for a blog
    if (data.startsWith('getLikes:')) {
      const blogId = data.split(':')[1];
      const blog = await prisma.blog.findUnique({
        where: { id: blogId },
        select: { likes: true },
      });
      ws.send(JSON.stringify({ type: 'likes_update', blogId, likes: blog?.likes ?? 0 }));
      return;
    }

    // Like a blog — increment and broadcast to all connected clients
    if (data.startsWith('like:')) {
      const blogId = data.split(':')[1];
      try {
        const updatedBlog = await prisma.blog.update({
          where: { id: blogId },
          data: { likes: { increment: 1 } },
          select: { likes: true },
        });
        // Invalidate single-blog cache
        await redisClient.del(`blog:${blogId}`);
        // Broadcast updated likes to ALL connected clients
        const payload = JSON.stringify({ type: 'likes_update', blogId, likes: updatedBlog.likes });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        });
      } catch (err) {
        console.error('Error incrementing likes:', err);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to like blog' }));
      }
      return;
    }

    // Unlike a blog — decrement (floor 0) and broadcast to all connected clients
    if (data.startsWith('unlike:')) {
      const blogId = data.split(':')[1];
      try {
        // Fetch current likes to prevent going below 0
        const current = await prisma.blog.findUnique({
          where: { id: blogId },
          select: { likes: true },
        });
        const newLikes = Math.max(0, (current?.likes ?? 1) - 1);
        const updatedBlog = await prisma.blog.update({
          where: { id: blogId },
          data: { likes: newLikes },
          select: { likes: true },
        });
        await redisClient.del(`blog:${blogId}`);
        const payload = JSON.stringify({ type: 'likes_update', blogId, likes: updatedBlog.likes });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        });
      } catch (err) {
        console.error('Error decrementing likes:', err);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to unlike blog' }));
      }
      return;
    }
  });

  ws.on('close', () => {
    // console.log('Client disconnected');
    if (userId) {
      userConnections.delete(userId);
      // console.log(`Connected users: ${userConnections.size}`);
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
    if (userId) {
      userConnections.delete(userId);
    }
  });
});

// Cache helper functions
const getCacheKey = (userId: string, type: 'all' | 'published' | 'drafts') => {
  return `user:${userId}:blogs:${type}`;
};

const invalidateUserBlogsCache = async (userId: string) => {
  const keys = [
    getCacheKey(userId, 'all'),
    getCacheKey(userId, 'published'),
    getCacheKey(userId, 'drafts'),
    `user_blogs:${userId}`, // Legacy cache key
  ];
  await Promise.all(keys.map(key => redisClient.del(key)));
};

// Safe public-blogs cache invalidation — avoids KEYS command (unsafe on Redis Cloud clusters)
const invalidatePublicBlogsCache = async () => {
  await redisClient.del('blogs:all');
};

// Helper function to get notifications for a user
async function getNotificationsForUser(userId: string) {
  const cacheKey = `user_notifications:${userId}`;
  const cachedNotifications = await redisClient.get(cacheKey);

  if (cachedNotifications) {
    return JSON.parse(cachedNotifications);
  }

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  await redisClient.set(cacheKey, JSON.stringify(notifications), { EX: 60 * 5 });
  return notifications;
}

// Helper function to broadcast notification to a user (clears stale cache first)
async function broadcastNotificationUpdate(userId: string) {
  // Invalidate stale notification cache before fetching fresh data
  await redisClient.del(`user_notifications:${userId}`);

  const connection = userConnections.get(userId);
  if (!connection || connection.ws.readyState !== WebSocket.OPEN) return;

  prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  }).then(notifications => {
    const unreadCount = notifications.filter(n => !n.read).length;
    connection.ws.send(JSON.stringify({
      type: 'notification_update',
      notifications,
      unreadCount,
    }));
  }).catch(err => console.error('broadcastNotificationUpdate error:', err));
}

// Public route - no auth required
app.get('/api/blogs', async (req, res:any) => {
  try {
    const cacheKey = 'blogs:all';
    const cachedBlogs = await redisClient.get(cacheKey);

    if (cachedBlogs) {
      // console.log('Serving from Redis cache');
      return res.json(JSON.parse(cachedBlogs));
    }

    const blogs = await prisma.blog.findMany({
      where: { published: true }, // Only show published blogs publicly
      include: {
        author: {
          select: {
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    await redisClient.setEx(cacheKey, 600, JSON.stringify(blogs));
    // console.log('Serving from DB and caching in Redis');
    return res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    return res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// Protected routes

app.get('/api/user', requireAuth(), authLimiter, async (req, res) => {
  try {
    const user = await syncUser(req);
    res.json(user);
  } catch (err: any) {
    console.error('Failed to sync user:', err);
    res.status(401).json({ error: err.message || 'Unauthorized' });
  }
});

// NEW AXIOS-COMPATIBLE ROUTES

// GET /api/user/blogs - Get all user's blogs (published + drafts)
app.get('/api/user/blogs', requireAuth(), async (req, res: any) => {
  // console.log("🔥 GET /api/user/blogs HIT");
  try {
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }
    
    const cacheKey = getCacheKey(user.id, 'all');
    const cachedBlogs = await redisClient.get(cacheKey);
    
    if (cachedBlogs) {
      // console.log('Serving user blogs from cache');
      return res.json({ blogs: JSON.parse(cachedBlogs) });
    }
    
    const blogs = await prisma.blog.findMany({
      where: { authorId: user.id },
      orderBy: [
        { published: 'desc' }, // Published blogs first
        { updatedAt: 'desc' }   // Then by most recent
      ],
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    await redisClient.setEx(cacheKey, 600, JSON.stringify(blogs));
    // console.log('Serving user blogs from DB and caching');
    return res.json({ blogs });
  } catch (error) {
    console.error('Error fetching user blogs:', error);
    return res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

// GET /api/user/blogs/published - Get only published blogs
app.get('/api/user/blogs/published', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }

    const cacheKey = getCacheKey(user.id, 'published');
    const cachedBlogs = await redisClient.get(cacheKey);

    if (cachedBlogs) {
      return res.json({ blogs: JSON.parse(cachedBlogs) });
    }

    const blogs = await prisma.blog.findMany({
      where: { 
        authorId: user.id,
        published: true 
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    await redisClient.setEx(cacheKey, 600, JSON.stringify(blogs));
    res.json({ blogs });
  } catch (error) {
    console.error('Error fetching published blogs:', error);
    res.status(500).json({ error: 'Failed to fetch published blogs' });
  }
});

// GET /api/user/blogs/drafts - Get only draft blogs
app.get('/api/user/blogs/drafts', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }

    const cacheKey = getCacheKey(user.id, 'drafts');
    const cachedBlogs = await redisClient.get(cacheKey);

    if (cachedBlogs) {
      return res.json({ blogs: JSON.parse(cachedBlogs) });
    }

    const blogs = await prisma.blog.findMany({
      where: { 
        authorId: user.id,
        published: false 
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    await redisClient.setEx(cacheKey, 600, JSON.stringify(blogs));
    res.json({ blogs });
  } catch (error) {
    console.error('Error fetching draft blogs:', error);
    res.status(500).json({ error: 'Failed to fetch draft blogs' });
  }
});

// DELETE /api/blogs/:id - Delete a blog (NEW AXIOS ROUTE)
app.delete('/api/blogs/:id', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const id = req.params.id as string;
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }

    // First check if the blog exists and belongs to the user
    const blog = await prisma.blog.findFirst({
      where: { 
        id,
        authorId: user.id 
      }
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found or you do not have permission to delete it' });
    }

    // Delete the blog
    await prisma.blog.delete({
      where: { id }
    });

    // Invalidate caches
    await invalidateUserBlogsCache(user.id);
    await redisClient.del(`blog:${id}`);
    await invalidatePublicBlogsCache();

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
});

// PATCH /api/blogs/:id/publish - Publish a draft blog (NEW AXIOS ROUTE)
app.patch('/api/blogs/:id/publish', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const id = req.params.id as string;
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }

    // First check if the blog exists, belongs to the user, and is a draft
    const blog = await prisma.blog.findFirst({
      where: { 
        id,
        authorId: user.id,
        published: false 
      }
    });

    if (!blog) {
      return res.status(404).json({ 
        error: 'Draft blog not found or you do not have permission to publish it' 
      });
    }

    // Update the blog to published
    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: { 
        published: true,
        updatedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        message: `Your blog "${blog.title}" was successfully published.`,
        userId: user.id,
        read: false,
      },
    });

    // Invalidate caches
    await invalidateUserBlogsCache(user.id);
    await redisClient.del(`blog:${id}`);
    await invalidatePublicBlogsCache();

    // Broadcast notification update (also clears stale notification cache)
    await broadcastNotificationUpdate(user.id);

    // Send email — non-blocking, won't crash this route
    sendBlogPublishedEmail(user.email, blog.title).catch((err) =>
      console.error('Email send failed (non-fatal):', err)
    );

    res.json({
      message: 'Blog published successfully',
      blog: updatedBlog,
    });
  } catch (error) {
    console.error('Error publishing blog:', error);
    res.status(500).json({ error: 'Failed to publish blog' });
  }
});

// POST /api/blogs - Create a new blog (NEW AXIOS ROUTE)
app.post('/api/blogs', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const { title, content, published = false } = req.body;
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        published,
        authorId: user.id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (published) {
      // Create notification for immediate publish
      await prisma.notification.create({
        data: {
          message: `Your blog "${title}" was successfully published.`,
          userId: user.id,
          read: false,
        },
      });

      // Broadcast notification update (clears stale cache internally)
      await broadcastNotificationUpdate(user.id);

      // Send email — non-blocking
      sendBlogPublishedEmail(user.email, title).catch((err) =>
        console.error('Email send failed (non-fatal):', err)
      );

      // Invalidate public blogs cache
      await invalidatePublicBlogsCache();
    }

    // Invalidate user blogs cache
    await invalidateUserBlogsCache(user.id);

    res.status(201).json({
      message: 'Blog created successfully',
      blog,
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

// PUT /api/blogs/:id - Update a blog (NEW AXIOS ROUTE)
app.put('/api/blogs/:id', requireAuth(), async (req, res: any) => {
  try {
    const id = req.params.id as string;
    const { title, content, published } = req.body;
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }

    // First check if the blog exists and belongs to the user
    const existingBlog = await prisma.blog.findFirst({
      where: { 
        id,
        authorId: user.id 
      }
    });

    if (!existingBlog) {
      return res.status(404).json({ error: 'Blog not found or you do not have permission to update it' });
    }

    // Update the blog
    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(published !== undefined && { published }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Invalidate caches
    await invalidateUserBlogsCache(user.id);
    await redisClient.del(`blog:${id}`);

    // If published status changed, invalidate public cache
    if (published !== undefined) {
      await invalidatePublicBlogsCache();
    }

    res.json({
      message: 'Blog updated successfully',
      blog: updatedBlog,
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  }
});

// LEGACY ROUTES (Keep for backward compatibility)

app.post('/api/create-blog', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    const { title, content, published } = req.body;

    if (!title || !content || typeof published !== "boolean") {
      return res.status(400).json({ message: "Missing or invalid fields" });
    }

    const newBlog = await prisma.blog.create({
      data: {
        title,
        content,
        published,
        authorId: user.id,
      },
    });

    if (published) {
      await prisma.notification.create({
        data: {
          message: `Your blog "${title}" was successfully published.`,
          userId: user.id,
          read: false,
        },
      });

      await broadcastNotificationUpdate(user.id);
      sendBlogPublishedEmail(user.email, title).catch((err) =>
        console.error('Email send failed (non-fatal):', err)
      );
    }

    await invalidatePublicBlogsCache();
    await invalidateUserBlogsCache(user.id);

    return res.status(201).json({ blog: newBlog });
  } catch (error) {
    console.error("Failed to create blog:", error);
    return res.status(500).json({
      message: "Blog creation failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get('/api/user/blogs/all', requireAuth(), async (req, res: any) => {
  // console.log("🔥 get /api/user/blogs/all HIT");
  try {
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ message: "User Not Authenticated" });
    }
    
    const cacheKey = `user_blogs:${user.id}`;
    const cachedBlogs = await redisClient.get(cacheKey);
    
    if (cachedBlogs) {
      return res.json({ blogs: JSON.parse(cachedBlogs) });
    }
    
    const blogs = await prisma.blog.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: 'desc' },
    });
    
    await redisClient.setEx(cacheKey, 600, JSON.stringify(blogs));
    return res.json({ blogs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch user blogs" });
  }
});

app.get('/api/blogs/:blogId', async (req, res: any) => {
  try {
    const { blogId } = req.params;
    
    const cacheKey = `blog:${blogId}`;
    const cachedBlog = await redisClient.get(cacheKey);

    if (cachedBlog) {
      // console.log('Serving single blog from Redis cache');
      return res.json(JSON.parse(cachedBlog));
    }

    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        author: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    await redisClient.setEx(cacheKey, 600, JSON.stringify(blog)); 
    // console.log('Serving single blog from DB and caching in Redis');
    return res.json(blog);
  } catch (err) {
    console.error('Error fetching blog:', err);
    return res.status(500).json({ error: 'Failed to fetch blog' });
  }
});

//Notifications
app.get('/api/user/notifications', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ message: "User Not Authenticated" });
    }

    const notifications = await getNotificationsForUser(user.id);
    // console.log('Serving notifications from cache/DB');
    return res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// PATCH /api/user/notifications/read-all
app.patch('/api/user/notifications/read-all', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ message: "User Not Authenticated" });

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    const updatedNotifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    await redisClient.set(`user_notifications:${user.id}`, JSON.stringify(updatedNotifications), {
      EX: 60 * 5,
    });

    await broadcastNotificationUpdate(user.id);

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    return res.status(500).json({ message: "Failed to mark as read" });
  }
});

// DELETE /api/user/notifications/:id
app.delete('/api/user/notifications/:id', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    const id = req.params.id as string;

    if (!user) return res.status(401).json({ message: "User Not Authenticated" });

    // Ensure the notification belongs to this user before deleting
    const notif = await prisma.notification.findFirst({
      where: { id: id, userId: user.id }
    });

    if (!notif) return res.status(404).json({ message: "Notification not found" });

    await prisma.notification.delete({
      where: { id: id }
    });

    // Invalidate cache and broadcast update
    const cacheKey = `user_notifications:${user.id}`;
    await redisClient.del(cacheKey);
    await broadcastNotificationUpdate(user.id);

    return res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ message: "Failed to delete notification" });
  }
});

// LEGACY DELETE ROUTE (Keep for backward compatibility)
app.delete("/api/blogs/delete/:id", requireAuth(), async (req, res: any) => {
  const blogId = req.params.id as string;

  try {
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }

    const existingBlog = await prisma.blog.findFirst({
      where: { 
        id: blogId,
        authorId: user.id 
      },
    });

    if (!existingBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    await prisma.blog.delete({
      where: { id: blogId },
    });

    try {
      await invalidateUserBlogsCache(user.id);
      await redisClient.del(`blog:${blogId}`);
      await invalidatePublicBlogsCache();
    } catch (cacheErr) {
      console.warn('Redis cache invalidation failed:', cacheErr);
    }

    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (err) {
    console.error("Delete blog error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// LEGACY PUBLISH ROUTE (Keep for backward compatibility)
app.patch("/api/draft/publish/:id", requireAuth(), async (req, res: any) => {
  const blogId = req.params.id as string;

  try {
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }

    const existingBlog = await prisma.blog.findFirst({
      where: { 
        id: blogId,
        authorId: user.id 
      },
    });

    if (!existingBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    const updatedBlog = await prisma.blog.update({
      where: { id: blogId },
      data: { published: true },
    });

    try {
      await invalidateUserBlogsCache(user.id);
      await redisClient.del(`blog:${blogId}`);
      await invalidatePublicBlogsCache();
    } catch (cacheErr) {
      console.warn('Redis cache invalidation failed:', cacheErr);
    }

    res.status(200).json({ message: 'Draft published successfully', blog: updatedBlog });
  } catch (err) {
    console.error("Publish draft error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/redis-test", async (req, res) => {
  try {
    await redisClient.set("health", "ok");
    const value = await redisClient.get("health");
    res.send({ redis: value });
  } catch (err) {
    console.error(err);
    res.status(500).send("Redis error");
  }
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Debugging Deployment Errors
app.get('/version', (_, res) => {
  res.json({
    version: '🟢 blogs-route-present',
    time: new Date().toISOString()
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
