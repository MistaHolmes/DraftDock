import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';
import redisClient from '../lib/redis';
import { syncUser } from '../sync';

const router = Router();

// GET /api/discovery/personalized-feed — based on reading history + tag affinity
router.get('/personalized-feed', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const cacheKey = `feed:${user.id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    // Get user's reading history tags
    const history = await prisma.readingHistory.findMany({
      where: { userId: user.id },
      include: { blog: { include: { tags: true } } },
      orderBy: { readAt: 'desc' },
      take: 20,
    });

    const tagScores: Record<string, number> = {};
    history.forEach(h => {
      h.blog.tags.forEach((t: any) => {
        tagScores[t.id] = (tagScores[t.id] || 0) + 1;
      });
    });

    const topTagIds = Object.entries(tagScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    // Get blogs from followed authors + tag-based recommendations
    const followedIds = await prisma.follow.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    });

    const readBlogIds = history.map(h => h.blog.id);

    const feed = await prisma.blog.findMany({
      where: {
        published: true,
        id: { notIn: readBlogIds },
        OR: [
          { authorId: { in: followedIds.map(f => f.followingId) } },
          ...(topTagIds.length > 0 ? [{ tags: { some: { id: { in: topTagIds } } } }] : []),
        ],
      },
      select: {
        id: true, title: true, summary: true, coverImage: true, published: true,
        likes: true, views: true, createdAt: true, updatedAt: true, authorId: true,
        author: { select: { email: true, name: true, profilePicture: true } }, tags: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    await redisClient.setEx(cacheKey, 300, JSON.stringify(feed));
    return res.json(feed);
  } catch (err) {
    console.error('Error fetching personalized feed:', err);
    return res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// GET /api/discovery/recommended-authors — based on followed authors connections
router.get('/recommended-authors', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Get who I follow
    const myFollows = await prisma.follow.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    });
    const myFollowIds = myFollows.map(f => f.followingId);

    // Get authors with most published blogs who I don't follow yet
    const recommended = await prisma.user.findMany({
      where: {
        id: { notIn: [user.id, ...myFollowIds] },
        blogs: { some: { published: true } },
      },
      select: {
        id: true, name: true, email: true, profilePicture: true, bio: true, isVerified: true, writerLevel: true,
        _count: { select: { blogs: true, followers: true } },
      },
      orderBy: { followers: { _count: 'desc' } },
      take: 6,
    });

    return res.json(recommended.map(a => ({
      ...a,
      name: a.name || a.email.split('@')[0],
      blogCount: a._count.blogs,
      followerCount: a._count.followers,
    })));
  } catch (err) {
    console.error('Error fetching recommended authors:', err);
    return res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;
