import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';
import { syncUser } from '../sync';
import { writeLimiter } from '../middleware/rateLimiter';

const router = Router();

// POST /api/series
router.post('/', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Series name is required' });

    const series = await prisma.series.create({
      data: { name: name.trim(), description: description?.trim() || null, authorId: user.id },
    });

    return res.status(201).json(series);
  } catch (err) {
    console.error('Error creating series:', err);
    return res.status(500).json({ error: 'Failed to create series' });
  }
});

// GET /api/series/:id
router.get('/:id', async (req, res: any) => {
  try {
    const { id } = req.params;
    const series = await prisma.series.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, email: true, name: true } },
        blogs: {
          where: { published: true },
          orderBy: { seriesOrder: 'asc' },
          include: { author: { select: { email: true, name: true } }, tags: true },
        },
      },
    });
    if (!series) return res.status(404).json({ error: 'Series not found' });
    return res.json(series);
  } catch (err) {
    console.error('Error fetching series:', err);
    return res.status(500).json({ error: 'Failed to fetch series' });
  }
});

export default router;
