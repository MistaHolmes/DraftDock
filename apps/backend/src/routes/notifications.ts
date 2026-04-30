import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';
import redisClient from '../lib/redis';
import { syncUser } from '../sync';
import { writeLimiter } from '../middleware/rateLimiter';
import { getNotificationsForUser, invalidateNotificationCache } from '../lib/websocket';

const router = Router();

// GET /api/user/notifications
router.get('/', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ message: 'User Not Authenticated' });

    const notifications = await getNotificationsForUser(user.id);
    const unreadCount = notifications.filter((n: any) => !n.read).length;
    return res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// PATCH /api/user/notifications/read-all
router.patch('/read-all', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ message: 'User Not Authenticated' });

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    await invalidateNotificationCache(user.id);

    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    return res.status(500).json({ message: 'Failed to mark as read' });
  }
});

// DELETE /api/user/notifications/:id
router.delete('/:id', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    const id = req.params.id as string;
    if (!user) return res.status(401).json({ message: 'User Not Authenticated' });

    const notif = await prisma.notification.findFirst({ where: { id, userId: user.id } });
    if (!notif) return res.status(404).json({ message: 'Notification not found' });

    await prisma.notification.delete({ where: { id } });
    await invalidateNotificationCache(user.id);

    return res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ message: 'Failed to delete notification' });
  }
});

export default router;
