import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';
import redisClient from '../lib/redis';
import { syncUser } from '../sync';
import { writeLimiter } from '../middleware/rateLimiter';

const router = Router();

// ── Enhanced Analytics ───────────────────────────────────────────────────────

// GET /api/analytics/views — daily view chart data (last 30 days)
router.get('/views', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const blogs = await prisma.blog.findMany({
      where: { authorId: user.id },
      select: { id: true },
    });
    const blogIds = blogs.map(b => b.id);
    if (blogIds.length === 0) return res.json({ daily: [], total: 0 });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await prisma.dailyViewStat.findMany({
      where: { blogId: { in: blogIds }, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
    });

    // Aggregate by date
    const dateMap: Record<string, number> = {};
    dailyStats.forEach(s => {
      const dateStr = s.date.toISOString().split('T')[0];
      dateMap[dateStr] = (dateMap[dateStr] || 0) + s.views;
    });

    const daily = Object.entries(dateMap).map(([date, views]) => ({ date, views }));
    const total = daily.reduce((sum, d) => sum + d.views, 0);

    return res.json({ daily, total });
  } catch (err) {
    console.error('Error fetching view analytics:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/engagement — engagement score breakdown
router.get('/engagement', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const [blogs, commentCount, bookmarkCount] = await Promise.all([
      prisma.blog.findMany({
        where: { authorId: user.id, published: true },
        select: { id: true, views: true, readingCompletions: true },
      }),
      prisma.comment.count({ where: { blog: { authorId: user.id } } }),
      prisma.bookmark.count({ where: { blog: { authorId: user.id } } }),
    ]);

    const totalViews = blogs.reduce((s, b) => s + b.views, 0);
    const totalCompletions = blogs.reduce((s, b) => s + b.readingCompletions, 0);

    // score = (comments×5 + bookmarks×4 + completions×6) / views × 100
    const rawScore = (commentCount * 5) + (bookmarkCount * 4) + (totalCompletions * 6);
    const engagementRate = totalViews > 0 ? Math.round((rawScore / totalViews) * 100) / 100 : 0;

    return res.json({
      engagementRate,
      totalViews,
      commentCount,
      bookmarkCount,
      totalCompletions,
      blogCount: blogs.length,
    });
  } catch (err) {
    console.error('Error fetching engagement:', err);
    return res.status(500).json({ error: 'Failed to fetch engagement' });
  }
});

// GET /api/analytics/follower-growth — follower count over time
router.get('/follower-growth', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const snapshots = await prisma.followerSnapshot.findMany({
      where: { userId: user.id },
      orderBy: { date: 'asc' },
      take: 30,
    });

    const currentCount = await prisma.follow.count({ where: { followingId: user.id } });

    return res.json({
      history: snapshots.map(s => ({ date: s.date.toISOString().split('T')[0], count: s.count })),
      current: currentCount,
    });
  } catch (err) {
    console.error('Error fetching follower growth:', err);
    return res.status(500).json({ error: 'Failed to fetch follower growth' });
  }
});

// GET /api/analytics/reading-completion — per-blog completion rates
router.get('/reading-completion', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const blogs = await prisma.blog.findMany({
      where: { authorId: user.id, published: true, views: { gt: 0 } },
      select: { id: true, title: true, views: true, readingCompletions: true },
      orderBy: { views: 'desc' },
      take: 10,
    });

    const completionData = blogs.map(b => ({
      id: b.id,
      title: b.title.slice(0, 50),
      views: b.views,
      completions: b.readingCompletions,
      rate: Math.round((b.readingCompletions / b.views) * 100),
    }));

    return res.json(completionData);
  } catch (err) {
    console.error('Error fetching reading completion:', err);
    return res.status(500).json({ error: 'Failed to fetch completion data' });
  }
});

// GET /api/analytics/reading-time — average reading time stats
router.get('/reading-time', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const blogs = await prisma.blog.findMany({
      where: { authorId: user.id, published: true },
      select: { id: true, title: true, content: true, views: true },
      orderBy: { views: 'desc' },
      take: 10,
    });

    const readingTimeData = blogs.map(b => {
      const wordCount = b.content.split(/\s+/).length;
      const readingTimeMin = Math.ceil(wordCount / 200);
      return { id: b.id, title: b.title.slice(0, 50), wordCount, readingTimeMin, views: b.views };
    });

    const avgReadingTime = readingTimeData.length > 0
      ? Math.round(readingTimeData.reduce((s, b) => s + b.readingTimeMin, 0) / readingTimeData.length)
      : 0;

    return res.json({ blogs: readingTimeData, avgReadingTime });
  } catch (err) {
    console.error('Error fetching reading time:', err);
    return res.status(500).json({ error: 'Failed to fetch reading time' });
  }
});

// ── Version History ──────────────────────────────────────────────────────────

// POST /api/analytics/versions/:blogId — save a version
router.post('/versions/:blogId', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { blogId } = req.params;
    const blog = await prisma.blog.findFirst({ where: { id: blogId, authorId: user.id } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const lastVersion = await prisma.blogVersion.findFirst({
      where: { blogId },
      orderBy: { version: 'desc' },
    });

    const version = await prisma.blogVersion.create({
      data: {
        blogId,
        title: blog.title,
        content: blog.content,
        version: (lastVersion?.version ?? 0) + 1,
      },
    });

    return res.status(201).json(version);
  } catch (err) {
    console.error('Error saving version:', err);
    return res.status(500).json({ error: 'Failed to save version' });
  }
});

// GET /api/analytics/versions/:blogId — list versions
router.get('/versions/:blogId', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { blogId } = req.params;
    const blog = await prisma.blog.findFirst({ where: { id: blogId, authorId: user.id }, select: { id: true } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const versions = await prisma.blogVersion.findMany({
      where: { blogId },
      orderBy: { version: 'desc' },
      select: { id: true, version: true, title: true, createdAt: true },
    });

    return res.json(versions);
  } catch (err) {
    console.error('Error fetching versions:', err);
    return res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// POST /api/analytics/versions/:blogId/restore/:versionId — restore a version
router.post('/versions/:blogId/restore/:versionId', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { blogId, versionId } = req.params;
    const blog = await prisma.blog.findFirst({ where: { id: blogId, authorId: user.id } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const version = await prisma.blogVersion.findFirst({ where: { id: versionId, blogId } });
    if (!version) return res.status(404).json({ error: 'Version not found' });

    // Save current state as a new version before restoring
    const lastVersion = await prisma.blogVersion.findFirst({ where: { blogId }, orderBy: { version: 'desc' } });
    await prisma.blogVersion.create({
      data: { blogId, title: blog.title, content: blog.content, version: (lastVersion?.version ?? 0) + 1 },
    });

    // Restore
    const updated = await prisma.blog.update({
      where: { id: blogId },
      data: { title: version.title, content: version.content },
    });

    await redisClient.del(`blog:${blogId}`);

    return res.json({ message: 'Version restored', blog: updated });
  } catch (err) {
    console.error('Error restoring version:', err);
    return res.status(500).json({ error: 'Failed to restore version' });
  }
});

// ── Leaderboard ──────────────────────────────────────────────────────────────

// GET /api/analytics/leaderboard — top writers
router.get('/leaderboard', async (req, res: any) => {
  try {
    const period = req.query.period as string || 'all';
    const cacheKey = `leaderboard:${period}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const users = await prisma.user.findMany({
      where: { blogs: { some: { published: true } } },
      select: {
        id: true, name: true, email: true, profilePicture: true, isVerified: true,
        writerLevel: true, writerXP: true,
        _count: { select: { blogs: true, followers: true } },
      },
      orderBy: { writerXP: 'desc' },
      take: 20,
    });

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      id: u.id,
      name: u.name || u.email.split('@')[0],
      profilePicture: u.profilePicture,
      isVerified: u.isVerified,
      writerLevel: u.writerLevel,
      writerXP: u.writerXP,
      blogCount: u._count.blogs,
      followerCount: u._count.followers,
    }));

    await redisClient.setEx(cacheKey, 300, JSON.stringify(leaderboard));
    return res.json(leaderboard);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
