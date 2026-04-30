import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';
import { syncUser } from '../sync';

const router = Router();

// GET /api/achievements/user — get user's earned achievements
router.get('/user', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const earned = await (prisma.userAchievement as any).findMany({
      where: { userId: user.id },
      include: { achievement: true },
      orderBy: { awardedAt: 'desc' }
    });

    return res.json(earned.map((ua: any) => ({
      ...ua.achievement,
      earnedAt: ua.createdAt
    })));
  } catch (err) {
    console.error('Error fetching user achievements:', err);
    return res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// GET /api/achievements/all — get all possible achievements
router.get('/all', async (req, res: any) => {
  try {
    const all = await (prisma.achievement as any).findMany({
      orderBy: { xpReward: 'asc' }
    });
    return res.json(all);
  } catch (err) {
    console.error('Error fetching all achievements:', err);
    return res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

export default router;
