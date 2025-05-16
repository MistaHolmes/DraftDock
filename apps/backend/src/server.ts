import express from 'express';
import { PrismaClient } from '@prisma/client';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import dotenv from 'dotenv';
import { syncUser } from './sync';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors  from 'cors';
import bodyParser from 'body-parser';

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
app.get('/api/blogs', async (req, res) => {
  const blogs = await prisma.blog.findMany();
  res.json(blogs);
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

app.post('/api/create-blog', requireAuth(), async (req, res) => {
  try {
    const user = await syncUser(req);

    const { title, content, published } = req.body;

    if (!title || !content || typeof published !== "boolean") {
      res.status(400).json({ message: "Missing or invalid fields" });
    }

    const newBlog = await prisma.blog.create({
      data: {
        title,
        content,
        published,
        authorId: user.id,
      },
    });

    res.status(201).json(newBlog);
  } catch (error) {
    console.error("Failed to create blog:", error);
    res.status(500).json({
      message: "Blog creation failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get('/api/user/blogs', requireAuth(), async (req, res) => {
  try {
    const user = await syncUser(req);
    if (!user) res.status(401).json({ message: "User Not Authenticated" });

    const blogs = await prisma.blog.findMany({
      where: { authorId: user.id },
    });
    res.json({ blogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user blogs" });
  }
});

app.post('/user/blogs/:blogId/like', requireAuth(), async (req, res) => {
  try {
    const prismaUser = await syncUser(req);
    const { blogId } = req.params;

    const updatedBlog = await prisma.blog.update({
      where: { id: blogId },
      data: {
        likes: {
          increment: 1,
        },
      },
      include: { author: true },
    });

    res.json({ likes: updatedBlog.likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to record like' });
  }
});

server.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
