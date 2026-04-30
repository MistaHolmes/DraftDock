import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';
import redisClient from '../lib/redis';
import { syncUser } from '../sync';
import { writeLimiter } from '../middleware/rateLimiter';

const router = Router();

// Helper: get like count from Redis first, fallback to DB
async function getLikeCount(blogId: string): Promise<number> {
  try {
    const cached = await redisClient.get(`blog:likes:${blogId}`);
    if (cached !== null) return parseInt(cached, 10);
  } catch {}

  const blog = await prisma.blog.findUnique({ where: { id: blogId }, select: { likes: true } });
  const count = blog?.likes ?? 0;

  try { await redisClient.setEx(`blog:likes:${blogId}`, 600, String(count)); } catch {}
  return count;
}

// Helper: check if user has liked a blog — Redis first, DB fallback (survives Redis flush on restart)
async function hasUserLiked(blogId: string, userId: string): Promise<boolean> {
  try {
    const inRedis = await redisClient.sIsMember(`blog:likedBy:${blogId}`, userId);
    if (inRedis) return true;
  } catch {}
  // Redis miss or server restart — check DB as source of truth
  try {
    const like = await prisma.blogLike.findUnique({
      where: { blogId_userId: { blogId, userId } },
    });
    if (like) {
      // Repopulate Redis for next time
      try { await redisClient.sAdd(`blog:likedBy:${blogId}`, userId); } catch {}
      return true;
    }
  } catch {}
  return false;
}

// GET /api/likes/:blogId — get like count + whether current user liked
router.get('/:blogId', async (req, res: any) => {
  try {
    const { blogId } = req.params;
    const count = await getLikeCount(blogId);

    // Check if there's a signed-in user
    let liked = false;
    try {
      const user = await syncUser(req);
      if (user) liked = await hasUserLiked(blogId, user.id);
    } catch {
      // Not signed in — that's fine
    }

    return res.json({ blogId, likes: count, liked });
  } catch (err) {
    console.error('Error fetching likes:', err);
    return res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

// POST /api/likes/:blogId — toggle like for the authenticated user
router.post('/:blogId', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const { blogId } = req.params;
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const blog = await prisma.blog.findUnique({ where: { id: blogId }, select: { id: true } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const alreadyLiked = await hasUserLiked(blogId, user.id);

    if (alreadyLiked) {
      // Unlike
      const updated = await prisma.blog.update({
        where: { id: blogId },
        data: { likes: { decrement: 1 } },
        select: { likes: true },
      });

      // Remove from DB (source of truth for like deduplication)
      try { await prisma.blogLike.deleteMany({ where: { blogId, userId: user.id } }); } catch {}

      try {
        await redisClient.sRem(`blog:likedBy:${blogId}`, user.id);
        await redisClient.set(`blog:likes:${blogId}`, String(Math.max(0, updated.likes)), { EX: 600 });
      } catch {}

      return res.json({ blogId, likes: Math.max(0, updated.likes), liked: false });
    } else {
      // Like
      const updated = await prisma.blog.update({
        where: { id: blogId },
        data: { likes: { increment: 1 } },
        select: { likes: true },
      });

      // Persist to DB — prevents duplicate likes after Redis flush/restart
      try {
        await prisma.blogLike.upsert({
          where: { blogId_userId: { blogId, userId: user.id } },
          create: { blogId, userId: user.id },
          update: {},
        });
      } catch {}

      try {
        await redisClient.sAdd(`blog:likedBy:${blogId}`, user.id);
        await redisClient.set(`blog:likes:${blogId}`, String(updated.likes), { EX: 600 });
      } catch {}

      return res.json({ blogId, likes: updated.likes, liked: true });
    }
  } catch (err) {
    console.error('Error toggling like:', err);
    return res.status(500).json({ error: 'Failed to toggle like' });
  }
});

export default router;
