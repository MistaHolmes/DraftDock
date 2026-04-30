/**
 * Collaboration HTTP routes.
 *
 * These complement the Hocuspocus WebSocket server with REST endpoints for:
 *  - Generating invite-token links (share-to-collaborate)
 *  - Starting / ending / querying session status
 *  - Explicit save (flush Y.Doc → Blog.content + BlogVersion)
 *  - Revoking invite tokens
 *  - Listing a user's active collab sessions
 */

import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import redisClient from '../lib/redis';
import { syncUser } from '../sync';
import { broadcastNotificationUpdate, invalidateUserBlogsCache, invalidatePublicBlogsCache } from '../lib/websocket';
import { decodeYdocToMarkdown } from '../lib/ydocToContent';

const router = Router();

// ── Generate invite token ────────────────────────────────────────────────────
// POST /api/collab/:blogId/invite
router.post('/:blogId/invite', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    const { blogId } = req.params;
    const { maxUses = 5, expiresInHours = 24 } = req.body;

    // Only blog author can generate invite tokens
    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    if (blog.authorId !== user.id) return res.status(403).json({ error: 'Only the blog author can generate invite links' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const invite = await prisma.collabInviteToken.create({
      data: {
        token,
        blogId,
        creatorId: user.id,
        maxUses,
        expiresAt,
      },
    });

    return res.status(201).json({
      invite,
      link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/collab/join/${token}`,
    });
  } catch (err) {
    console.error('Failed to create invite token:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Validate invite token (called by frontend before connecting to WS) ───────
// GET /api/collab/token/:token
router.get('/token/:token', async (req, res: any) => {
  try {
    const { token } = req.params;
    const invite = await prisma.collabInviteToken.findUnique({
      where: { token },
      include: {
        blog: { select: { id: true, title: true, coverImage: true } },
        creator: { select: { id: true, name: true, profilePicture: true } },
      },
    });

    if (!invite) return res.status(404).json({ error: 'Invalid invite link' });
    if (invite.status !== 'ACTIVE') return res.status(410).json({ error: 'This invite link has been ' + invite.status.toLowerCase() });
    if (invite.expiresAt < new Date()) return res.status(410).json({ error: 'This invite link has expired' });
    if (invite.uses >= invite.maxUses) return res.status(410).json({ error: 'This invite link has reached its usage limit' });

    return res.json({
      blogId: invite.blogId,
      blog: invite.blog,
      creator: invite.creator,
      expiresAt: invite.expiresAt,
      remainingUses: invite.maxUses - invite.uses,
    });
  } catch (err) {
    console.error('Failed to validate token:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Revoke invite token ──────────────────────────────────────────────────────
// DELETE /api/collab/token/:token
router.delete('/token/:token', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    const { token } = req.params;

    const invite = await prisma.collabInviteToken.findUnique({ where: { token } });
    if (!invite) return res.status(404).json({ error: 'Token not found' });
    if (invite.creatorId !== user.id) return res.status(403).json({ error: 'Unauthorized' });

    await prisma.collabInviteToken.update({ where: { id: invite.id }, data: { status: 'REVOKED' } });
    return res.json({ message: 'Token revoked' });
  } catch (err) {
    console.error('Failed to revoke token:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Start collab session ─────────────────────────────────────────────────────
// POST /api/collab/:blogId/start
router.post('/:blogId/start', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    const { blogId } = req.params;

    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    // Author or accepted co-author can start
    if (blog.authorId !== user.id) {
      const coAuthor = await (prisma as any).coAuthor.findFirst({
        where: { blogId, userId: user.id, status: 'ACCEPTED' },
      });
      if (!coAuthor) return res.status(403).json({ error: 'Not authorized' });
    }

    // Mark session active in Redis
    try { await redisClient.set(`collab:active:${blogId}`, '1', { EX: 86400 }); } catch {}

    // Return co-authors list
    const coAuthors = await (prisma as any).coAuthor.findMany({
      where: { blogId, status: 'ACCEPTED' },
      include: { user: { select: { id: true, name: true, profilePicture: true, email: true } } },
    });

    return res.json({
      blogId,
      title: blog.title,
      coAuthors,
      wsUrl: `ws://${req.get('host')?.replace(/:\d+$/, '')}:${process.env.COLLAB_PORT || 3002}`,
    });
  } catch (err) {
    console.error('Failed to start collab session:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Session status ───────────────────────────────────────────────────────────
// GET /api/collab/:blogId/status
router.get('/:blogId/status', async (req, res: any) => {
  try {
    const { blogId } = req.params;
    let active = false;
    try { active = (await redisClient.get(`collab:active:${blogId}`)) === '1'; } catch {}

    const activeSessions = await prisma.collabSession.findMany({
      where: { blogId, leftAt: null },
      include: { user: { select: { id: true, name: true, profilePicture: true } } },
    });

    return res.json({ active, participants: activeSessions });
  } catch (err) {
    console.error('Failed to get collab status:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Explicit save ────────────────────────────────────────────────────────────
// POST /api/collab/:blogId/save
router.post('/:blogId/save', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    const { blogId } = req.params;

    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    if (blog.authorId !== user.id) return res.status(403).json({ error: 'Only the author can save' });

    // Read Y.Doc from Redis
    let content = blog.content;
    try {
      const cached = await redisClient.get(`collab:ydoc:${blogId}`);
      if (cached) {
        content = decodeYdocToMarkdown(Buffer.from(cached, 'base64'));
      }
    } catch {}

    // Update blog content
    await prisma.blog.update({
      where: { id: blogId },
      data: { content },
    });

    // Create version snapshot (race-safe: use max instead of count)
    const agg = await prisma.blogVersion.aggregate({ where: { blogId }, _max: { version: true } });
    const nextVersion = (agg._max.version ?? 0) + 1;
    let savedVersion = nextVersion;
    try {
      await prisma.blogVersion.create({
        data: { blogId, title: blog.title, content, version: nextVersion },
      });
    } catch (vErr: any) {
      if (vErr?.code === 'P2002') {
        // Concurrent save won the race — query the real latest version to return
        const latest = await prisma.blogVersion.findFirst({ where: { blogId }, orderBy: { version: 'desc' }, select: { version: true } });
        savedVersion = latest?.version ?? nextVersion;
      } else {
        throw vErr;
      }
    }

    await invalidateUserBlogsCache(user.id);
    await invalidatePublicBlogsCache();

    return res.json({ savedAt: new Date().toISOString(), version: savedVersion });
  } catch (err) {
    console.error('Failed to save collab:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── End session ──────────────────────────────────────────────────────────────
// DELETE /api/collab/:blogId/end
router.delete('/:blogId/end', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    const { blogId } = req.params;

    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    if (blog.authorId !== user.id) return res.status(403).json({ error: 'Only the author can end a session' });

    // Flush Y.Doc to Postgres one last time
    try {
      const cached = await redisClient.get(`collab:ydoc:${blogId}`);
      if (cached) {
        const content = decodeYdocToMarkdown(Buffer.from(cached, 'base64'));
        await prisma.blog.update({ where: { id: blogId }, data: { content } });
      }
    } catch {}

    // Delete Redis keys
    try {
      await redisClient.del(`collab:active:${blogId}`);
      await redisClient.del(`collab:ydoc:${blogId}`);
    } catch {}

    // Close remaining sessions
    await prisma.collabSession.updateMany({
      where: { blogId, leftAt: null },
      data: { leftAt: new Date() },
    });

    await invalidateUserBlogsCache(user.id);

    return res.json({ message: 'Collaboration session ended' });
  } catch (err) {
    console.error('Failed to end collab session:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── List user's collab sessions (for the Collaborate landing page) ───────────
// GET /api/collab/my-sessions
router.get('/my-sessions', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);

    // Blogs I own that are unpublished drafts (active collab sessions)
    const ownedBlogs = await prisma.blog.findMany({
      where: { authorId: user.id, published: false },
      select: {
        id: true,
        title: true,
        published: true,
        coverImage: true,
        updatedAt: true,
        coAuthors: {
          where: { status: 'ACCEPTED' },
          include: { user: { select: { id: true, name: true, profilePicture: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Blogs I'm co-authored on
    const coAuthoredBlogs = await (prisma as any).coAuthor.findMany({
      where: { userId: user.id, status: 'ACCEPTED' },
      include: {
        blog: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            updatedAt: true,
            author: { select: { id: true, name: true, profilePicture: true } },
          },
        },
      },
    });

    return res.json({
      // Return ALL blogs the user owns so they can start a session on any of them
      owned: ownedBlogs,
      coAuthored: coAuthoredBlogs.map((ca: any) => ({
        ...ca.blog,
        role: ca.role,
      })),
    });
  } catch (err) {
    console.error('Failed to get my sessions:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
