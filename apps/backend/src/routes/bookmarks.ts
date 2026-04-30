import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';
import { syncUser } from '../sync';
import { writeLimiter } from '../middleware/rateLimiter';

const router = Router();

// GET /api/user/bookmarks
router.get('/', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      include: { blog: { select: {
        id: true, title: true, summary: true, coverImage: true, published: true,
        likes: true, views: true, createdAt: true, updatedAt: true, authorId: true,
        author: { select: { email: true, name: true, profilePicture: true } }, tags: true,
      } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(bookmarks.map((b: any) => b.blog));
  } catch (err) {
    console.error('Error fetching bookmarks:', err);
    return res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// POST /api/user/bookmarks
router.post('/', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const { blogId } = req.body;
    if (!blogId) return res.status(400).json({ error: 'blogId required' });

    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const bookmark = await prisma.bookmark.upsert({
      where: { userId_blogId: { userId: user.id, blogId } },
      update: {},
      create: { userId: user.id, blogId },
    });

    return res.status(201).json(bookmark);
  } catch (err) {
    console.error('Error creating bookmark:', err);
    return res.status(500).json({ error: 'Failed to bookmark' });
  }
});

// DELETE /api/user/bookmarks/:blogId
router.delete('/:blogId', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const { blogId } = req.params;
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.bookmark.deleteMany({ where: { userId: user.id, blogId } });
    return res.json({ message: 'Bookmark removed' });
  } catch (err) {
    console.error('Error removing bookmark:', err);
    return res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});

// GET /api/user/bookmarks/ids
router.get('/ids', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      select: { blogId: true },
    });
    return res.json(bookmarks.map((b: any) => b.blogId));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch bookmark IDs' });
  }
});

export default router;
