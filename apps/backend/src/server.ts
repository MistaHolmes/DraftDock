import express from 'express';
import { PrismaClient } from '@prisma/client';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import dotenv from 'dotenv';
import { syncUser } from './sync';
import http from 'http';
import { WebSocketServer } from 'ws';
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

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    const data = message.toString();

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
  });
});

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

    // Invalidate notifications cache for this user
    const cacheKey = `user_notifications:${user.id}`;
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    await redisClient.set(cacheKey, JSON.stringify(notifications), { EX: 60 * 5 });

    await redisClient.del('blogs:all');
    return res.status(201).json(newBlog,notifications);
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

    const cacheKey = `user_notifications:${user.id}`;
    const cachedNotifications = await redisClient.get(cacheKey);

    if (cachedNotifications) {
      console.log('Serving notifications from Redis cache');
      return res.json({ notifications: JSON.parse(cachedNotifications) });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    await redisClient.set(cacheKey, JSON.stringify(notifications), { EX: 60 * 5 });

    console.log('Serving notifications from DB and caching in Redis');
    return res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

server.listen(port, () => {
  console.log(`http://localhost:${port}`);
});