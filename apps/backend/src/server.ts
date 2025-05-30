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

const redisClient = createClient({
  url: 'redis://localhost:6379',
});

redisClient.connect().catch(console.error);
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;
const server = http.createServer(app);

app.use(clerkMiddleware());
app.use(cors({
  origin: 'http://localhost:5173',
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

// Ping interval (30 seconds)
const PING_INTERVAL = 30000;
const PONG_TIMEOUT = 5000;

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
      ws.ping();
      console.log(`Ping sent to user ${userId}`);
    }, PING_INTERVAL);
  };

  // Handle pong responses
  ws.on('pong', () => {
    console.log(`Pong received from user ${userId}`);
    connectionData.isAlive = true;
  });

  // Handle ping from client (respond with pong)
  ws.on('ping', () => {
    console.log(`Ping received from user ${userId}, sending pong`);
    ws.pong();
  });

  ws.on('message', async (message) => {
    const data = message.toString();

    // Handle user registration for notifications
    if (data.startsWith('register:')) {
      userId = data.split(':')[1];
      connectionData.isAlive = true;
      userConnections.set(userId, connectionData);
      console.log(`User ${userId} registered for notifications`);
      
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
      console.log(`Pong message received from user ${userId}`);
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
      console.log(`User ${userId} unregistered from notifications`);
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

// Helper function to broadcast notification updates to a user
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


app.get('/', async (req, res) => {
  res.json('HelloW')
});

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

    await redisClient.setEx(cacheKey, 600, JSON.stringify(blogs)); // TTL 60s
    console.log('Serving from DB and caching in Redis');
    return res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    return res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// Protected routes - add requireAuth as middleware

app.get('/api/user', requireAuth(), async (req, res) => {
  try {
    const user = await syncUser(req);
    res.json(user);
  } catch (err: any) {
    console.error('Failed to sync user:', err);
    res.status(401).json({ error: err.message || 'Unauthorized' });
  }
});

app.post('/api/create-blog', requireAuth(), async (req, res:any) => {
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
    
    const notification = await prisma.notification.create({
      data: {
        message: `Your blog "${title}" was successfully published.`,
        userId: user.id,
        read: false,
      },
    });

    // Invalidate notifications cache for this user
    const cacheKey = `user_notifications:${user.id}`;
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    await redisClient.set(cacheKey, JSON.stringify(notifications), { EX: 60 * 5 });

    // Broadcast notification update to user via WebSocket
    await broadcastNotificationUpdate(user.id);

    await redisClient.del('blogs:all');
    return res.status(201).json({ blog: newBlog, notifications });
  } catch (error) {
    console.error("Failed to create blog:", error);
    return res.status(500).json({
      message: "Blog creation failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get('/api/user/blogs', requireAuth(), async (req, res:any) => {
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
      select: {
        published: true,
      }
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

    // Refresh Redis cache
    const updatedNotifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    await redisClient.set(`user_notifications:${user.id}`, JSON.stringify(updatedNotifications), {
      EX: 60 * 5,
    });

    // Broadcast the update to user via WebSocket
    await broadcastNotificationUpdate(user.id);

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Failed to mark notifications as read:", error);
    return res.status(500).json({ message: "Failed to mark as read" });
  }
});

server.listen(port, () => {
  console.log(`http://localhost:${port}`);
});