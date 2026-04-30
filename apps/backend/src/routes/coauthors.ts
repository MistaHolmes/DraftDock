import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';
import { syncUser } from '../sync';
import { broadcastNotificationUpdate } from '../lib/websocket';

const router = Router();

// POST /api/blogs/:blogId/coauthors — Invite a co-author
router.post('/:blogId/coauthors', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    const { blogId } = req.params;
    const { inviteeEmail, role } = req.body;

    if (!inviteeEmail) return res.status(400).json({ error: 'Invitee email is required' });

    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    if (blog.authorId !== user.id) return res.status(403).json({ error: 'Only the original author can invite co-authors' });

    const invitee = await prisma.user.findUnique({ where: { email: inviteeEmail } });
    if (!invitee) return res.status(404).json({ error: 'Invitee user not found on platform' });

    if (invitee.id === user.id) return res.status(400).json({ error: 'You cannot invite yourself' });

    const existing = await (prisma as any).coAuthor.findUnique({
      where: { blogId_userId: { blogId, userId: invitee.id } }
    });
    if (existing) return res.status(400).json({ error: 'User is already a collaborator or invited' });

    const coAuthor = await (prisma as any).coAuthor.create({
      data: {
        blogId,
        userId: invitee.id,
        role: role || 'CONTRIBUTOR',
        status: 'PENDING'
      }
    });

    // Notify invitee
    await prisma.notification.create({
      data: {
        userId: invitee.id,
        message: `${user.name || user.email} invited you to co-author "${blog.title}".`
      }
    });
    await broadcastNotificationUpdate(invitee.id);

    return res.status(201).json({ coAuthor });
  } catch (err) {
    console.error('Failed to invite co-author:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/blogs/:blogId/coauthors — List co-authors
router.get('/:blogId/coauthors', async (req, res: any) => {
  try {
    const { blogId } = req.params;
    const coAuthors = await (prisma as any).coAuthor.findMany({
      where: { blogId },
      include: { user: { select: { id: true, name: true, profilePicture: true, email: true } } }
    });
    return res.json(coAuthors);
  } catch (err) {
    console.error('Failed to list co-authors:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/coauthors/:id/status — Accept/Decline invitation
router.patch('/status/:id', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    const { id } = req.params;
    const { status } = req.body; // 'ACCEPTED' or 'DECLINED'

    if (!['ACCEPTED', 'DECLINED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const coAuthor = await (prisma as any).coAuthor.findUnique({ 
      where: { id },
      include: { blog: true }
    });
    if (!coAuthor) return res.status(404).json({ error: 'Invitation not found' });
    if (coAuthor.userId !== user.id) return res.status(403).json({ error: 'Unauthorized' });

    const updated = await (prisma as any).coAuthor.update({
      where: { id },
      data: { status }
    });

    if (status === 'ACCEPTED') {
        // Notify owner
        await prisma.notification.create({
            data: {
                userId: coAuthor.blog.authorId,
                message: `${user.name || user.email} accepted your invitation to co-author "${coAuthor.blog.title}".`
            }
        });
        await broadcastNotificationUpdate(coAuthor.blog.authorId);
    }

    return res.json(updated);
  } catch (err) {
    console.error('Failed to update invite status:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
