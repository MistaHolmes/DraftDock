import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';
import { syncUser } from '../sync';
import { writeLimiter } from '../middleware/rateLimiter';
import redisClient from '../lib/redis';

const router = Router();

// GET /api/authors/:userId — public author profile
router.get('/:userId', async (req, res: any) => {
  try {
    const { userId } = req.params;
    const cacheKey = `author:${userId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const author = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, bio: true, createdAt: true,
        blogs: {
          where: { published: true },
          select: { id: true, title: true, content: true, likes: true, createdAt: true, updatedAt: true, coverImage: true, tags: true },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!author) return res.status(404).json({ error: 'Author not found' });
    await redisClient.setEx(cacheKey, 300, JSON.stringify(author));
    return res.json(author);
  } catch (err) {
    console.error('Error fetching author:', err);
    return res.status(500).json({ error: 'Failed to fetch author' });
  }
});

// GET /api/authors/:userId/follow-counts
router.get('/:userId/follow-counts', async (req, res: any) => {
  try {
    const { userId } = req.params;
    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);
    return res.json({ followerCount, followingCount });
  } catch (err) {
    console.error('Error fetching follow counts:', err);
    return res.status(500).json({ error: 'Failed to fetch follow counts' });
  }
});

export default router;
