import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';
import redisClient from '../lib/redis';
import { syncUser } from '../sync';
import { writeLimiter } from '../middleware/rateLimiter';
import { broadcastNotificationUpdate } from '../lib/websocket';
import { checkAndAwardAchievements } from '../services/achievement.service';

const router = Router();

// POST /api/user/follow
router.post('/', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { userId: targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'userId is required' });
    if (targetUserId === user.id) return res.status(400).json({ error: 'Cannot follow yourself' });

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, name: true, email: true } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const follow = await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: user.id, followingId: targetUserId } },
      update: {},
      create: { followerId: user.id, followingId: targetUserId },
    });

    await prisma.notification.create({
      data: { message: `${user.name || user.email.split('@')[0]} started following you.`, userId: targetUserId, read: false },
    });
    await broadcastNotificationUpdate(targetUserId);
    await redisClient.del(`author:${targetUserId}`);

    // Check achievements for both (follower and following)
    checkAndAwardAchievements(user.id);
    checkAndAwardAchievements(targetUserId);

    return res.status(201).json({ message: 'Followed successfully', follow });
  } catch (err) {
    console.error('Error following user:', err);
    return res.status(500).json({ error: 'Failed to follow user' });
  }
});

// DELETE /api/user/unfollow/:userId
router.delete('/unfollow/:userId', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { userId: targetUserId } = req.params;
    await prisma.follow.deleteMany({ where: { followerId: user.id, followingId: targetUserId } });
    await redisClient.del(`author:${targetUserId}`);

    return res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    console.error('Error unfollowing user:', err);
    return res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// GET /api/user/followers
router.get('/followers', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: { follower: { select: { id: true, email: true, name: true, profilePicture: true, bio: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(followers.map((f: any) => f.follower));
  } catch (err) {
    console.error('Error fetching followers:', err);
    return res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// GET /api/user/following
router.get('/following', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      include: { following: { select: { id: true, email: true, name: true, profilePicture: true, bio: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(following.map((f: any) => f.following));
  } catch (err) {
    console.error('Error fetching following:', err);
    return res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// GET /api/user/is-following/:userId
router.get('/is-following/:userId', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { userId: targetUserId } = req.params;
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: user.id, followingId: targetUserId } },
    });

    return res.json({ isFollowing: !!follow });
  } catch (err) {
    console.error('Error checking follow status:', err);
    return res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// GET /api/authors/:userId/follow-counts
router.get('/counts/:userId', async (req, res: any) => {
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
