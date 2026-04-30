import { Router } from 'express';
import prisma from '../lib/prisma';
import redisClient from '../lib/redis';

const router = Router();

// GET /api/tags
router.get('/', async (req, res: any) => {
  try {
    const cacheKey = 'tags:all';
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const tags = await prisma.tag.findMany({
      include: { _count: { select: { blogs: true } } },
      orderBy: { name: 'asc' },
    });

    const result = tags.map((t: any) => ({ name: t.name, count: t._count.blogs }));
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
    return res.json(result);
  } catch (err) {
    console.error('Error fetching tags:', err);
    return res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// GET /api/tags/trending
router.get('/trending', async (req, res: any) => {
  try {
    const cacheKey = 'tags:trending';
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const tags = await prisma.tag.findMany({
      include: { _count: { select: { blogs: true } } },
      orderBy: { blogs: { _count: 'desc' } },
      take: 15,
    });

    const result = tags.map((t: any) => ({ name: t.name, count: t._count.blogs }));
    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
    return res.json(result);
  } catch (err) {
    console.error('Error fetching trending tags:', err);
    return res.status(500).json({ error: 'Failed to fetch trending tags' });
  }
});

export default router;
