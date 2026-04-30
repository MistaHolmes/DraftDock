import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';
import redisClient from '../lib/redis';
import { syncUser } from '../sync';
import { authLimiter, writeLimiter } from '../middleware/rateLimiter';
import { invalidateUserBlogsCache, getCacheKey } from '../lib/websocket';

const router = Router();

// GET /api/user — sync and get current user
router.get('/', requireAuth(), authLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    res.json(user);
  } catch (err: any) {
    console.error('Failed to sync user:', err);
    res.status(401).json({ error: err.message || 'Unauthorized' });
  }
});

// PATCH /api/user/profile
router.patch('/profile', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, bio } = req.body;
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { ...(name !== undefined && { name }), ...(bio !== undefined && { bio }) },
      select: { id: true, email: true, name: true, bio: true },
    });

    await redisClient.del(`author:${user.id}`);
    return res.json(updated);
  } catch (err) {
    console.error('Error updating profile:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/user/blogs
router.get('/blogs', requireAuth(), async (req: any, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const cacheKey = `user_blogs:${user.id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json({ blogs: JSON.parse(cached) });

    const blogs = await prisma.blog.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, summary: true, content: true, published: true, createdAt: true, updatedAt: true, coverImage: true, tags: true },
    });

    await redisClient.setEx(cacheKey, 120, JSON.stringify(blogs));
    return res.json({ blogs });
  } catch (err) {
    console.error('Error fetching user blogs:', err);
    return res.status(500).json({ error: 'Failed to fetch user blogs' });
  }
});

// GET /api/user/blogs/published
router.get('/blogs/published', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'User Not Authenticated' });

    const cacheKey = getCacheKey(user.id, 'published');
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json({ blogs: JSON.parse(cached) });

    const blogs = await prisma.blog.findMany({
      where: { authorId: user.id, published: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, summary: true, content: true, published: true, createdAt: true, updatedAt: true, coverImage: true, tags: true },
    });

    await redisClient.setEx(cacheKey, 600, JSON.stringify(blogs));
    res.json({ blogs });
  } catch (error) {
    console.error('Error fetching published blogs:', error);
    res.status(500).json({ error: 'Failed to fetch published blogs' });
  }
});

// GET /api/user/blogs/drafts
router.get('/blogs/drafts', requireAuth(), async (req: any, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const drafts = await prisma.blog.findMany({
      where: { authorId: user.id, published: false },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, content: true, published: true, createdAt: true, updatedAt: true },
    });

    return res.json({ blogs: drafts });
  } catch (err) {
    console.error('Error fetching drafts:', err);
    return res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

// GET /api/user/blogs/all (legacy)
router.get('/blogs/all', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ message: 'User Not Authenticated' });

    const cacheKey = `user_blogs:${user.id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json({ blogs: JSON.parse(cached) });

    const blogs = await prisma.blog.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    await redisClient.setEx(cacheKey, 600, JSON.stringify(blogs));
    return res.json({ blogs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch user blogs' });
  }
});

// GET /api/user/stats
router.get('/stats', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const [blogs, commentCount] = await Promise.all([
      prisma.blog.findMany({
        where: { authorId: user.id },
        select: { id: true, title: true, published: true, views: true, createdAt: true },
        orderBy: { views: 'desc' },
      }),
      prisma.comment.count({ where: { blog: { authorId: user.id } } }),
    ]);

    const publishedCount = blogs.filter((b: any) => b.published).length;
    const draftCount = blogs.filter((b: any) => !b.published).length;
    const topBlog = blogs[0] || null;

    return res.json({ totalBlogs: blogs.length, publishedCount, draftCount, commentCount, topBlog, blogs });
  } catch (err) {
    console.error('Error fetching stats:', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/user/history
router.get('/history', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const history = await prisma.readingHistory.findMany({
      where: { userId: user.id },
      include: { blog: { select: {
        id: true, title: true, summary: true, coverImage: true, published: true,
        likes: true, views: true, createdAt: true, updatedAt: true, authorId: true,
        author: { select: { email: true, name: true, profilePicture: true } }, tags: true,
      } } },
      orderBy: { readAt: 'desc' },
      take: 50,
    });

    return res.json(history.map((h: any) => ({ ...h.blog, readAt: h.readAt })));
  } catch (err) {
    console.error('Error fetching history:', err);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// POST /api/user/history
router.post('/history', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { blogId } = req.body;
    if (!blogId) return res.status(400).json({ error: 'blogId is required' });

    // Guard: make sure the blog actually exists before creating the FK reference
    const blogExists = await prisma.blog.findUnique({ where: { id: blogId }, select: { id: true } });
    if (!blogExists) return res.status(404).json({ error: 'Blog not found' });

    await (prisma as any).readingHistory.upsert({
      where: { userId_blogId: { userId: user.id, blogId } },
      update: { readAt: new Date() },
      create: { userId: user.id, blogId },
    });

    const lastRead = (user as any).lastReadDate;
    const now = new Date();
    let newStreak = (user as any).readingStreak || 0;

    if (!lastRead) {
      newStreak = 1;
    } else {
      const lastReadDate = new Date(lastRead);
      const isToday = lastReadDate.toDateString() === now.toDateString();

      if (!isToday) {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = lastReadDate.toDateString() === yesterday.toDateString();

        if (isYesterday) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }
    }

    const longestStreak = Math.max(newStreak, (user as any).longestStreak || 0);

    await (prisma.user as any).update({
      where: { id: user.id },
      data: {
        lastReadDate: now,
        readingStreak: newStreak,
        longestStreak: longestStreak,
        writerXP: { increment: 5 } as any
      }
    });

    return res.json({ message: 'History recorded', streak: newStreak });
  } catch (err) {
    console.error('Error recording history:', err);
    return res.status(500).json({ error: 'Failed to record history' });
  }
});


// DELETE /api/user/history
router.delete('/history', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.readingHistory.deleteMany({ where: { userId: user.id } });
    return res.json({ message: 'History cleared' });
  } catch (err) {
    console.error('Error clearing history:', err);
    return res.status(500).json({ error: 'Failed to clear history' });
  }
});

// GET /api/user/series
router.get('/series', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const seriesList = await prisma.series.findMany({
      where: { authorId: user.id },
      include: { _count: { select: { blogs: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json(seriesList);
  } catch (err) {
    console.error('Error fetching user series:', err);
    return res.status(500).json({ error: 'Failed to fetch series' });
  }
});

export default router;
