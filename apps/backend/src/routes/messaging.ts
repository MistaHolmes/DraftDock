import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';
import { syncUser } from '../sync';
import { writeLimiter } from '../middleware/rateLimiter';
import { getWSS, userConnections, broadcastNotificationUpdate } from '../lib/websocket';
import { WebSocket } from 'ws';

const router = Router();

// ── Conversations ────────────────────────────────────────────────────────────

// GET /api/messaging/conversations — list user's conversations
router.get('/conversations', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ participant1Id: user.id }, { participant2Id: user.id }] },
      include: {
        participant1: { select: { id: true, name: true, email: true, profilePicture: true } },
        participant2: { select: { id: true, name: true, email: true, profilePicture: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const formatted = conversations.map(c => {
      const other = c.participant1Id === user.id ? c.participant2 : c.participant1;
      const lastMessage = c.messages[0] || null;
      return { id: c.id, otherUser: other, lastMessage, lastMessageAt: c.lastMessageAt };
    });

    return res.json(formatted);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// POST /api/messaging/conversations — create or get conversation
router.post('/conversations', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { userId: targetId } = req.body;
    if (!targetId) return res.status(400).json({ error: 'userId is required' });
    if (targetId === user.id) return res.status(400).json({ error: 'Cannot message yourself' });

    // Check if conversation already exists (either direction)
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: user.id, participant2Id: targetId },
          { participant1Id: targetId, participant2Id: user.id },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { participant1Id: user.id, participant2Id: targetId },
      });
    }

    return res.json(conversation);
  } catch (err) {
    console.error('Error creating conversation:', err);
    return res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// GET /api/messaging/conversations/:id/messages — get messages
router.get('/conversations/:id/messages', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const conversation = await prisma.conversation.findFirst({
      where: { id, OR: [{ participant1Id: user.id }, { participant2Id: user.id }] },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: { sender: { select: { id: true, name: true, email: true, profilePicture: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: { conversationId: id, receiverId: user.id, read: false },
      data: { read: true },
    });

    return res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/messaging/conversations/:id/messages — send message
router.post('/conversations/:id/messages', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Message content is required' });

    const conversation = await prisma.conversation.findFirst({
      where: { id, OR: [{ participant1Id: user.id }, { participant2Id: user.id }] },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const receiverId = conversation.participant1Id === user.id ? conversation.participant2Id : conversation.participant1Id;

    const message = await prisma.message.create({
      data: { content: content.trim(), senderId: user.id, receiverId, conversationId: id },
      include: { sender: { select: { id: true, name: true, email: true, profilePicture: true } } },
    });

    // Update conversation timestamp
    await prisma.conversation.update({ where: { id }, data: { lastMessageAt: new Date() } });

    // Push real-time notification to receiver
    const conn = userConnections.get(receiverId);
    if (conn && conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(JSON.stringify({
        type: 'new_message',
        conversationId: id,
        message,
      }));
    }

    return res.status(201).json(message);
  } catch (err) {
    console.error('Error sending message:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/messaging/unread-count — unread message count
router.get('/unread-count', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const count = await prisma.message.count({
      where: { receiverId: user.id, read: false },
    });

    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// ── Highlights ───────────────────────────────────────────────────────────────

// POST /api/messaging/highlights — save a highlight
router.post('/highlights', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { blogId, text, startOffset, endOffset, note } = req.body;
    if (!blogId || !text) return res.status(400).json({ error: 'blogId and text are required' });

    const highlight = await prisma.highlight.create({
      data: { userId: user.id, blogId, text, startOffset: startOffset || 0, endOffset: endOffset || 0, note },
    });

    return res.status(201).json(highlight);
  } catch (err) {
    console.error('Error saving highlight:', err);
    return res.status(500).json({ error: 'Failed to save highlight' });
  }
});

// GET /api/messaging/highlights — get user's highlights
router.get('/highlights', requireAuth(), async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const highlights = await prisma.highlight.findMany({
      where: { userId: user.id },
      include: { blog: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json(highlights);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch highlights' });
  }
});

// DELETE /api/messaging/highlights/:id
router.delete('/highlights/:id', requireAuth(), writeLimiter, async (req, res: any) => {
  try {
    const user = await syncUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const highlight = await prisma.highlight.findFirst({ where: { id: req.params.id, userId: user.id } });
    if (!highlight) return res.status(404).json({ error: 'Highlight not found' });

    await prisma.highlight.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Highlight deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete highlight' });
  }
});

export default router;
