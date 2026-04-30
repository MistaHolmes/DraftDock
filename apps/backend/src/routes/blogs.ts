import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';
import redisClient from '../lib/redis';
import { syncUser } from '../sync';
import { sendBlogPublishedEmail } from '../email';
import { writeLimiter } from '../middleware/rateLimiter';
import { broadcastNotificationUpdate, invalidateUserBlogsCache, invalidatePublicBlogsCache, getCacheKey } from '../lib/websocket';
import { checkAndAwardAchievements } from '../services/achievement.service';

const router = Router();

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Select clause shared by all list endpoints — excludes heavy `content` column */
const BLOG_LIST_SELECT = {
  id: true,
  title: true,
  summary: true,
  coverImage: true,
  published: true,
  likes: true,
  views: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
  author: { select: { id: true, email: true, name: true, profilePicture: true } },
  tags: true,
} as const;

/** Safe Redis get — returns null on any error so requests still work if Redis is down */
async function safeRedisGet(key: string): Promise<string | null> {
  try { return await redisClient.get(key); } catch { return null; }
}

/** Safe Redis set — fire-and-forget, never blocks the response */
function safeRedisSet(key: string, ttl: number, data: string): void {
  redisClient.setEx(key, ttl, data).catch(() => {});
}

// GET /api/blogs — public, all published blogs
router.get('/', async (req, res: any) => {
  try {
    const cacheKey = 'blogs:all';
    const cached = await safeRedisGet(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const blogs = await prisma.blog.findMany({
      where: { published: true },
      select: BLOG_LIST_SELECT,
      orderBy: { updatedAt: 'desc' },
    });

    safeRedisSet(cacheKey, 600, JSON.stringify(blogs));
    return res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    return res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// GET /api/blogs/trending
router.get('/trending', async (req, res: any) => {
  try {
    const cacheKey = 'blogs:trending';
    const cached = await safeRedisGet(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const blogs = await prisma.blog.findMany({
      where: { published: true, updatedAt: { gte: sevenDaysAgo } },
      select: BLOG_LIST_SELECT,
      orderBy: { views: 'desc' },
      take: 6,
    });

    safeRedisSet(cacheKey, 120, JSON.stringify(blogs));
    return res.json(blogs);
  } catch (err) {
    console.error('Error fetching trending:', err);
    return res.status(500).json({ error: 'Failed to fetch trending blogs' });
  }
});

// GET /api/blogs/featured
router.get('/featured', async (req, res: any) => {
  try {
    const cacheKey = 'blogs:featured';
    const cached = await safeRedisGet(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const blogs = await prisma.blog.findMany({
      where: { published: true, featured: true },
      select: BLOG_LIST_SELECT,
      orderBy: { updatedAt: 'desc' },
      take: 6,
    });

    safeRedisSet(cacheKey, 300, JSON.stringify(blogs));
    return res.json(blogs);
  } catch (err) {
    console.error('Error fetching featured:', err);
    return res.status(500).json({ error: 'Failed to fetch featured blogs' });
  }
});

// GET /api/blogs/search
router.get('/search', async (req, res: any) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) return res.json([]);

    const cacheKey = `search:${q.toLowerCase().slice(0, 100)}`;
    const cached = await safeRedisGet(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const blogs = await prisma.blog.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: BLOG_LIST_SELECT,
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    safeRedisSet(cacheKey, 120, JSON.stringify(blogs));
    return res.json(blogs);
  } catch (err) {
    console.error('Error searching blogs:', err);
    return res.status(500).json({ error: 'Failed to search blogs' });
  }
});

// GET /api/blogs/by-tag/:tag
router.get('/by-tag/:tag', async (req, res: any) => {
  try {
    const { tag } = req.params;
    const cacheKey = `blogs:tag:${tag}`;
    const cached = await safeRedisGet(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const blogs = await prisma.blog.findMany({
      where: { published: true, tags: { some: { name: { equals: tag, mode: 'insensitive' } } } },
      select: BLOG_LIST_SELECT,
      orderBy: { updatedAt: 'desc' },
    });

    safeRedisSet(cacheKey, 300, JSON.stringify(blogs));
    return res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs by tag:', err);
    return res.status(500).json({ error: 'Failed to fetch blogs by tag' });
  }
});

// GET /api/blogs/:blogId
router.get('/:blogId', async (req, res: any) => {
  try {
    const { blogId } = req.params;
    const cacheKey = `blog:${blogId}`;
    const cached = await safeRedisGet(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        author: { select: { id: true, email: true, name: true, profilePicture: true } },
        tags: true,
        series: true
      },
    });

    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    safeRedisSet(cacheKey, 600, JSON.stringify(blog));
    return res.json(blog);
  } catch (err) {
    console.error('Error fetching blog:', err);
    return res.status(500).json({ error: 'Failed to fetch blog' });
  }
});

// POST /api/blogs/:blogId/view
router.post('/:blogId/view', async (req, res: any) => {
  try {
    const { blogId } = req.params;
    const blog = await prisma.blog.update({
      where: { id: blogId },
      data: { views: { increment: 1 } },
      select: { views: true },
    });
    try { await redisClient.del(`blog:${blogId}`); } catch { /* non-fatal */ }
    return res.json({ views: blog.views });
  } catch (err: any) {
    // P2025 = record not found — blog may have been deleted or DB was reset
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Blog not found' });
    console.error('Error incrementing views:', err);
    return res.status(500).json({ error: 'Failed to increment views' });
  }
});

// POST /api/blogs — create
router.post('/', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const { title, content, published = false, coverImage, summary, scheduledAt, readabilityScore } = req.body;
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'User Not Authenticated' });
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        published,
        coverImage,
        summary,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        readabilityScore: readabilityScore ? parseFloat(readabilityScore) : null,
        authorId: user.id
      },
      select: { id: true, title: true, content: true, published: true, createdAt: true, updatedAt: true },
    });

    if (published) {
      await prisma.notification.create({
        data: { message: `Your blog "${title}" was successfully published.`, userId: user.id, read: false },
      });
      await broadcastNotificationUpdate(user.id);
      sendBlogPublishedEmail(user.email, title).catch((err) => console.error('Email send failed (non-fatal):', err));
      await invalidatePublicBlogsCache();
      // Check achievements
      checkAndAwardAchievements(user.id);
    }
    await invalidateUserBlogsCache(user.id);

    res.status(201).json({ message: 'Blog created successfully', blog });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

// PUT /api/blogs/:id — update
router.put('/:id', requireAuth(), writeLimiter, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { title, content, published, coverImage, summary, scheduledAt, readabilityScore } = req.body;
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await prisma.blog.findFirst({ where: { id, authorId: user.id } });
    if (!existing) return res.status(404).json({ error: 'Blog not found' });

    const updated = await prisma.blog.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(published !== undefined && { published }),
        ...(coverImage !== undefined && { coverImage }),
        ...(summary !== undefined && { summary }),
        ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
        ...(readabilityScore !== undefined && { readabilityScore: parseFloat(readabilityScore) }),
      },
    });

    await redisClient.del(`blog:${id}`);
    await invalidateUserBlogsCache(user.id);
    await invalidatePublicBlogsCache();

    return res.json(updated);
  } catch (err) {
    console.error('Error updating blog:', err);
    return res.status(500).json({ error: 'Failed to update blog' });
  }
});

// PATCH /api/blogs/:id/publish
router.patch('/:id/publish', requireAuth(), writeLimiter, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await prisma.blog.findFirst({ where: { id, authorId: user.id } });
    if (!existing) return res.status(404).json({ error: 'Blog not found' });

    const updated = await prisma.blog.update({ where: { id }, data: { published: true, updatedAt: new Date() } });

    await prisma.notification.create({
      data: { message: `Your blog "${existing.title}" was successfully published.`, userId: user.id, read: false },
    });
    await broadcastNotificationUpdate(user.id);
    sendBlogPublishedEmail(user.email, existing.title).catch((err) => console.error('Email send failed (non-fatal):', err));

    await redisClient.del(`blog:${id}`);
    await invalidateUserBlogsCache(user.id);
    await invalidatePublicBlogsCache();

    // Check achievements
    checkAndAwardAchievements(user.id);

    return res.json({ message: 'Blog published', blog: updated });
  } catch (err) {
    console.error('Error publishing blog:', err);
    return res.status(500).json({ error: 'Failed to publish blog' });
  }
});

// DELETE /api/blogs/:id
router.delete('/:id', requireAuth(), writeLimiter, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const existing = await prisma.blog.findFirst({ where: { id, authorId: user.id } });
    if (!existing) return res.status(404).json({ error: 'Blog not found' });

    await prisma.blog.delete({ where: { id } });
    await redisClient.del(`blog:${id}`);
    await invalidateUserBlogsCache(user.id);
    await invalidatePublicBlogsCache();

    return res.json({ message: 'Blog deleted' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    return res.status(500).json({ error: 'Failed to delete blog' });
  }
});

// GET /api/blogs/:id/related
router.get('/:id/related', async (req, res: any) => {
  try {
    const { id } = req.params;
    const blog = await prisma.blog.findUnique({ where: { id }, include: { tags: { select: { id: true } } } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const tagIds = blog.tags.map((t: any) => t.id);
    if (tagIds.length === 0) return res.json([]);

    const related = await prisma.blog.findMany({
      where: { published: true, id: { not: id }, tags: { some: { id: { in: tagIds } } } },
      include: { author: { select: { id: true, email: true, name: true, profilePicture: true } }, tags: true },
      orderBy: { views: 'desc' },
      take: 4,
    });

    return res.json(related);
  } catch (err) {
    console.error('Error fetching related blogs:', err);
    return res.status(500).json({ error: 'Failed to fetch related blogs' });
  }
});

// PUT /api/blogs/:id/tags
router.put('/:id/tags', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;
    if (!Array.isArray(tags)) return res.status(400).json({ error: 'tags must be an array' });

    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const blog = await prisma.blog.findFirst({ where: { id, authorId: user.id } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const tagRecords = await Promise.all(
      tags.map((name: string) => prisma.tag.upsert({
        where: { name: name.toLowerCase().trim() },
        update: {},
        create: { name: name.toLowerCase().trim() },
      }))
    );

    await prisma.blog.update({
      where: { id },
      data: { tags: { set: tagRecords.map((t: any) => ({ id: t.id })) } },
    });

    await redisClient.del(`blog:${id}`);
    await redisClient.del('tags:all');
    return res.json({ message: 'Tags updated', tags: tagRecords });
  } catch (err) {
    console.error('Error updating tags:', err);
    return res.status(500).json({ error: 'Failed to update tags' });
  }
});

// PUT /api/blogs/:id/series
router.put('/:id/series', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const { id } = req.params;
    const { seriesId, seriesOrder } = req.body;
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const blog = await prisma.blog.findFirst({ where: { id, authorId: user.id } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const updated = await prisma.blog.update({
      where: { id },
      data: { seriesId: seriesId || null, seriesOrder: seriesOrder ?? null },
    });

    return res.json(updated);
  } catch (err) {
    console.error('Error updating blog series:', err);
    return res.status(500).json({ error: 'Failed to update blog series' });
  }
});

// ── Blog Versioning ─────────────────────────────────────────────────────────

// GET /api/blogs/:id/versions — list versions
router.get('/:id/versions', requireAuth(), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const versions = await prisma.blogVersion.findMany({
      where: { blogId: id, blog: { authorId: user.id } },
      orderBy: { version: 'desc' },
    });
    return res.json(versions);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// POST /api/blogs/:id/versions — save current state as a version
router.post('/:id/versions', requireAuth(), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const blog = await prisma.blog.findFirst({ where: { id, authorId: user.id } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const lastVersion = await prisma.blogVersion.findFirst({
      where: { blogId: id },
      orderBy: { version: 'desc' },
    });

    const newVersion = await prisma.blogVersion.create({
      data: {
        blogId: id,
        title: blog.title,
        content: blog.content,
        version: (lastVersion?.version ?? 0) + 1,
      },
    });

    return res.status(201).json(newVersion);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save version' });
  }
});

// POST /api/blogs/:id/versions/:versionId/restore
router.post('/:id/versions/:versionId/restore', requireAuth(), async (req: any, res: any) => {
  try {
    const { id, versionId } = req.params;
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const version = await prisma.blogVersion.findFirst({
      where: { id: versionId, blogId: id, blog: { authorId: user.id } },
    });
    if (!version) return res.status(404).json({ error: 'Version not found' });

    const updated = await prisma.blog.update({
      where: { id },
      data: { title: version.title, content: version.content },
    });

    await redisClient.del(`blog:${id}`);
    await invalidateUserBlogsCache(user.id);

    return res.json({ message: 'Version restored', blog: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to restore version' });
  }
});

export default router;
