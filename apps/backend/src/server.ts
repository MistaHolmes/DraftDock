import express from 'express';
import { PrismaClient } from '@prisma/client';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import dotenv from 'dotenv';
import { syncUser } from './sync';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors  from 'cors';
import bodyParser from 'body-parser';
import { createClient } from 'redis';
import { sendBlogPublishedEmail } from './email';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.connect().catch(console.error);
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = parseInt(process.env.PORT || '3000', 10);
const server = http.createServer(app);

app.use(clerkMiddleware());
app.use(cors({
  origin: true
  // ['http://localhost:5173',
  //   'http://35.202.48.53',
  //   'http://34.66.221.1',
  //   'https://frontend-1113988436.asia-south1.run.app',
  // ]
  ,
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.json());

// Store user WebSocket connections with ping/pong tracking
interface UserConnection {
  ws: WebSocket;
  isAlive: boolean;
  pingInterval?: NodeJS.Timeout;
}

const userConnections = new Map<string, UserConnection>();

const wss = new WebSocketServer({ server });

const PING_INTERVAL = 60000; 
const PONG_TIMEOUT = 10000;  

wss.on('connection', (ws) => {
  console.log('Client connected');
  let userId: string | null = null;
  let connectionData: UserConnection = { ws, isAlive: true };

  // Set up ping/pong mechanism
  const startPingInterval = () => {
    connectionData.pingInterval = setInterval(() => {
      if (!connectionData.isAlive) {
        console.log(`User ${userId} failed to respond to ping, terminating connection`);
        clearInterval(connectionData.pingInterval!);
        ws.terminate();
        return;
      }

      connectionData.isAlive = false;

      const timeout = setTimeout(() => {
        if (!connectionData.isAlive) {
          console.log(`User did not respond to ping within timeout, terminating`);
          clearInterval(connectionData.pingInterval!);
          ws.terminate();
        }
      }, PONG_TIMEOUT);

      ws.ping();

      console.log(`Ping sent to user`);

      ws.once('pong', () => {
          clearTimeout(timeout);
          connectionData.isAlive = true;
      });
    }, PING_INTERVAL);
  };

  // Handle pong responses
  ws.on('pong', () => {
    console.log(`Pong received from user `);
    connectionData.isAlive = true;
  });

  // Handle ping from client (respond with pong)
  ws.on('ping', () => {
    console.log(`Ping received from user, sending pong`);
    ws.pong();
  });

  ws.on('message', async (message) => {
    const data = message.toString();

    // Handle user registration for notifications
    if (data.startsWith('register:')) {
      userId = data.split(':')[1];
      connectionData.isAlive = true;
      userConnections.set(userId, connectionData);
      console.log(`Connected users: ${userConnections.size}`);
      
      // Start ping/pong mechanism after registration
      startPingInterval();
      
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

    // Handle pong response as message (some clients send pong as message)
    if (data === 'pong') {
      console.log(`Pong message received from user`);
      connectionData.isAlive = true;
      return;
    }

    // Handle existing blog likes functionality
    if (data.startsWith('getLikes:')) {
      const blogId = data.split(':')[1];
      const blog = await prisma.blog.findUnique({
        where: { id: blogId },
        select: { likes: true },
      });

      ws.send(JSON.stringify({ blogId, likes: blog?.likes ?? 0 }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (userId) {
      const connection = userConnections.get(userId);
      if (connection?.pingInterval) {
        clearInterval(connection.pingInterval);
      }
      userConnections.delete(userId);
      console.log(`Connected users: ${userConnections.size}`);
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
    if (userId) {
      const connection = userConnections.get(userId);
      if (connection?.pingInterval) {
        clearInterval(connection.pingInterval);
      }
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
    `user_blogs:${userId}` // Legacy cache key
  ];
  await Promise.all(keys.map(key => redisClient.del(key)));
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

// Helper function to broadcast notification to a user
function broadcastNotificationUpdate(userId: string) {
  const connection = userConnections.get(userId);
  if (!connection || connection.ws.readyState !== WebSocket.OPEN) return;

  prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  }).then(notifications => {
    const unreadCount = notifications.filter(n => !n.read).length;

    connection.ws.send(JSON.stringify({
      type: "notification_update",
      notifications,
      unreadCount,
    }));
  });
}

// Public route - no auth required
app.get('/api/blogs', async (req, res:any) => {
  try {
    const cacheKey = 'blogs:all';
    const cachedBlogs = await redisClient.get(cacheKey);

    if (cachedBlogs) {
      console.log('Serving from Redis cache');
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
    console.log('Serving from DB and caching in Redis');
    return res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    return res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// Protected routes

app.get('/api/user', requireAuth(), async (req, res) => {
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
  console.log("🔥 GET /api/user/blogs HIT");
  try {
    const user = await syncUser(req);
    if (!user) {
      return res.status(401).json({ error: "User Not Authenticated" });
    }
    
    const cacheKey = getCacheKey(user.id, 'all');
    const cachedBlogs = await redisClient.get(cacheKey);
    
    if (cachedBlogs) {
      console.log('Serving user blogs from cache');
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
    console.log('Serving user blogs from DB and caching');
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
app.delete('/api/blogs/:id', requireAuth(), async (req, res: any) => {
  try {
    const { id } = req.params;
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

    // Invalidate cache
    await invalidateUserBlogsCache(user.id);
    await redisClient.del(`blog:${id}`);
    
    // Invalidate public blogs cache
    const keysToDelete = await redisClient.keys('blogs:*');
    if (keysToDelete.length > 0) {
      await Promise.all(keysToDelete.map(key => redisClient.del(key)));
    }

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
});

// PATCH /api/blogs/:id/publish - Publish a draft blog (NEW AXIOS ROUTE)
app.patch('/api/blogs/:id/publish', requireAuth(), async (req, res: any) => {
  try {
    const { id } = req.params;
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
    
    // Invalidate public blogs cache
    const keysToDelete = await redisClient.keys('blogs:*');
    if (keysToDelete.length > 0) {
      await Promise.all(keysToDelete.map(key => redisClient.del(key)));
    }

    // Update notifications cache
    const cacheKey = `user_notifications:${user.id}`;
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    await redisClient.set(cacheKey, JSON.stringify(notifications), { EX: 60 * 5 });

    // Broadcast notification update
    await broadcastNotificationUpdate(user.id);
    
    // Send email
    sendBlogPublishedEmail(user.email, blog.title);

    res.json({ 
      message: 'Blog published successfully',
      blog: updatedBlog 
    });
  } catch (error) {
    console.error('Error publishing blog:', error);
    res.status(500).json({ error: 'Failed to publish blog' });
  }
});

// POST /api/blogs - Create a new blog (NEW AXIOS ROUTE)
app.post('/api/blogs', requireAuth(), async (req, res: any) => {
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
      // Create notification
      const notification = await prisma.notification.create({
        data: {
          message: `Your blog "${title}" was successfully published.`,
          userId: user.id,
          read: false,
        },
      });

      // Update notifications cache
      const cacheKey = `user_notifications:${user.id}`;
      const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      await redisClient.set(cacheKey, JSON.stringify(notifications), { EX: 60 * 5 });

      await broadcastNotificationUpdate(user.id);
      sendBlogPublishedEmail(user.email, title);

      // Invalidate public blogs cache
      const keysToDelete = await redisClient.keys('blogs:*');
      if (keysToDelete.length > 0) {
        await Promise.all(keysToDelete.map(key => redisClient.del(key)));
      }
    }

    // Invalidate user blogs cache
    await invalidateUserBlogsCache(user.id);

    res.status(201).json({ 
      message: 'Blog created successfully',
      blog 
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

// PUT /api/blogs/:id - Update a blog (NEW AXIOS ROUTE)
app.put('/api/blogs/:id', requireAuth(), async (req, res: any) => {
  try {
    const { id } = req.params;
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
      const keysToDelete = await redisClient.keys('blogs:*');
      if (keysToDelete.length > 0) {
        await Promise.all(keysToDelete.map(key => redisClient.del(key)));
      }
    }

    res.json({ 
      message: 'Blog updated successfully',
      blog: updatedBlog 
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

    let notifications = [];

    if (published) {
      const notification = await prisma.notification.create({
        data: {
          message: `Your blog "${title}" was successfully published.`,
          userId: user.id,
          read: false,
        },
      });

      // Invalidate notifications cache
      const cacheKey = `user_notifications:${user.id}`;
      notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      await redisClient.set(cacheKey, JSON.stringify(notifications), { EX: 60 * 5 });

      await broadcastNotificationUpdate(user.id);
      sendBlogPublishedEmail(user.email, title);      
    }

    await redisClient.del('blogs:all');
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
  console.log("🔥 get /api/user/blogs/all HIT");
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
      console.log('Serving single blog from Redis cache');
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
    console.log('Serving single blog from DB and caching in Redis');
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
    console.log('Serving notifications from cache/DB');
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

// LEGACY DELETE ROUTE (Keep for backward compatibility)
app.delete("/api/blogs/delete/:id", requireAuth(), async (req, res: any) => {
  const blogId = req.params.id;

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

      const keysToDelete = await redisClient.keys('blogs:*');
      if (keysToDelete.length > 0) {
        await Promise.all(keysToDelete.map(key => redisClient.del(key)));
      }
    } catch (cacheErr) {
      console.warn("Redis cache invalidation failed:", cacheErr);
    }

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Delete blog error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// LEGACY PUBLISH ROUTE (Keep for backward compatibility)
app.patch("/api/draft/publish/:id", requireAuth(), async (req, res: any) => {
  const blogId = req.params.id;

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

      const keysToDelete = await redisClient.keys('blogs:*');
      if (keysToDelete.length > 0) {
        await Promise.all(keysToDelete.map((key) => redisClient.del(key)));
      }
    } catch (cacheErr) {
      console.warn("Redis cache invalidation failed:", cacheErr);
    }

    res.status(200).json({ message: "Draft published successfully", blog: updatedBlog });
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
