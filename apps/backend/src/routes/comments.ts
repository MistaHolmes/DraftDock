import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';
import { syncUser } from '../sync';
import { writeLimiter } from '../middleware/rateLimiter';
import { checkAndAwardAchievements } from '../services/achievement.service';

const router = Router();

// GET /api/blogs/:id/comments
router.get('/:id/comments', async (req, res: any) => {
  try {
    const { id } = req.params;
    const comments = await prisma.comment.findMany({
      where: { blogId: id },
      include: { author: { select: { email: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/blogs/:id/comments
router.post('/:id/comments', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Comment content is required' });

    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const blog = await prisma.blog.findUnique({ where: { id }, select: { id: true } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const comment = await prisma.comment.create({
      data: { content: content.trim(), blogId: id, authorId: user.id },
      include: { author: { select: { id: true, email: true, name: true } }, blog: { select: { authorId: true } } },
    });

    // Check achievements for commenter and blog author
    checkAndAwardAchievements(user.id);
    checkAndAwardAchievements((comment.blog as any).authorId);

    return res.status(201).json(comment);
  } catch (err) {
    console.error('Error creating comment:', err);
    return res.status(500).json({ error: 'Failed to create comment' });
  }
});

// DELETE /api/comments/:id
router.delete('/:id', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const { id } = req.params;
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const comment = await prisma.comment.findFirst({ where: { id, authorId: user.id } });
    if (!comment) return res.status(404).json({ error: 'Comment not found or not authorized' });

    await prisma.comment.delete({ where: { id } });
    return res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
