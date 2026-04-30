import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';
import { syncUser } from '../sync';

const router = Router();

// GET /api/highlights/blog/:blogId — get all highlights for a blog
router.get('/blog/:blogId', async (req, res: any) => {
  try {
    const { blogId } = req.params;
    const highlights = await (prisma as any).highlight.findMany({
      where: { blogId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(highlights);
  } catch (err) {
    console.error('Error fetching highlights:', err);
    return res.status(500).json({ error: 'Failed to fetch highlights' });
  }
});

// POST /api/highlights — create a new highlight
router.post('/', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { blogId, text, startOffset, endOffset, note } = req.body;
    if (!blogId || !text) return res.status(400).json({ error: 'blogId and text are required' });

    const highlight = await (prisma as any).highlight.create({
      data: {
        userId: user.id,
        blogId,
        text,
        startOffset: startOffset || 0,
        endOffset: endOffset || 0,
        note
      },
      include: { user: { select: { name: true, email: true } } }
    });

    // Award XP for contributing a highlight
    await (prisma.user as any).update({
      where: { id: user.id },
      data: { writerXP: { increment: 2 } }
    });

    return res.status(201).json(highlight);
  } catch (err) {
    console.error('Error creating highlight:', err);
    return res.status(500).json({ error: 'Failed to create highlight' });
  }
});

// DELETE /api/highlights/:id
router.delete('/:id', requireAuth(), async (req, res: any) => {
  try {
    const { id } = req.params;
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const highlight = await (prisma as any).highlight.findFirst({
      where: { id, userId: user.id }
    });

    if (!highlight) return res.status(404).json({ error: 'Highlight not found or not owned by you' });

    await (prisma as any).highlight.delete({ where: { id } });
    return res.json({ message: 'Highlight deleted' });
  } catch (err) {
    console.error('Error deleting highlight:', err);
    return res.status(500).json({ error: 'Failed to delete highlight' });
  }
});

export default router;
