import { WebSocketServer, WebSocket } from 'ws';
import prisma from './prisma';
import redisClient from './redis';

export interface UserConnection {
  ws: WebSocket;
  isAlive: boolean;
  userId: string;
}

export const userConnections = new Map<string, UserConnection>();

let wssInstance: WebSocketServer | null = null;

export function getWSS(): WebSocketServer {
  if (!wssInstance) throw new Error('WebSocket server not initialized');
  return wssInstance;
}

// ── Notification helpers (CRUD-only, no WS push) ────────────────────────────

export async function getNotificationsForUser(userId: string) {
  try {
    const cacheKey = `user_notifications:${userId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  try {
    await redisClient.set(`user_notifications:${userId}`, JSON.stringify(notifications), { EX: 300 });
  } catch {}
  return notifications;
}

/**
 * Invalidate notification cache so next GET fetches fresh data.
 * No WebSocket push — frontend polls via HTTP.
 */
export async function invalidateNotificationCache(userId: string) {
  try { await redisClient.del(`user_notifications:${userId}`); } catch {}
}

// Keep backward-compat export name (used in scheduler + legacy routes)
export const broadcastNotificationUpdate = invalidateNotificationCache;

// ── Cache helpers ────────────────────────────────────────────────────────────

export const getCacheKey = (userId: string, type: 'all' | 'published' | 'drafts') => {
  return `user:${userId}:blogs:${type}`;
};

export const invalidateUserBlogsCache = async (userId: string) => {
  const keys = [
    getCacheKey(userId, 'all'),
    getCacheKey(userId, 'published'),
    getCacheKey(userId, 'drafts'),
    `user_blogs:${userId}`,
  ];
  try { await Promise.all(keys.map(key => redisClient.del(key))); } catch {}
};

export const invalidatePublicBlogsCache = async () => {
  try { await redisClient.del('blogs:all'); } catch {}
};

// ── Broadcast like update to all connected clients ───────────────────────────

export function broadcastLikeUpdate(blogId: string, likes: number) {
  if (!wssInstance) return;
  const payload = JSON.stringify({ type: 'like_update', blogId, likes });
  wssInstance.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// ── Standalone WebSocket server on its own port ──────────────────────────────

export function initWebSocket(wsPort: number = 3001) {
  const wss = new WebSocketServer({ port: wsPort, host: '0.0.0.0' });
  wssInstance = wss;

  console.log(`WebSocket server running on ws://0.0.0.0:${wsPort}`);

  const PING_INTERVAL = 30000;

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const conn = Array.from(userConnections.values()).find(c => c.ws === ws);
      if (conn) {
        if (!conn.isAlive) {
          console.log(`User ${conn.userId} failed heartbeat, terminating`);
          userConnections.delete(conn.userId);
          return ws.terminate();
        }
        conn.isAlive = false;
        ws.ping();
      }
    });
  }, PING_INTERVAL);

  wss.on('close', () => clearInterval(interval));

  wss.on('connection', (ws) => {
    let userId: string | null = null;
    let connectionData: UserConnection = { ws, isAlive: true, userId: '' };

    ws.on('pong', () => { connectionData.isAlive = true; });

    ws.on('message', async (message) => {
      const data = message.toString();

      // Register user connection
      if (data.startsWith('register:')) {
        userId = data.split(':')[1];
        connectionData.userId = userId;
        connectionData.isAlive = true;
        userConnections.set(userId, connectionData);
        ws.send(JSON.stringify({ type: 'registered', userId }));
        return;
      }

      // Heartbeat
      if (data === 'pong') { connectionData.isAlive = true; return; }
      if (data === 'ping') { connectionData.isAlive = true; ws.send('pong'); return; }

      // ── WebRTC Signaling ──────────────────────────────────────────────
      try {
        const msg = JSON.parse(data);

        // Call offer: caller → server → callee
        if (msg.type === 'call-offer') {
          const target = userConnections.get(msg.targetUserId);
          if (target && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(JSON.stringify({
              type: 'incoming-call',
              from: userId,
              callerName: msg.callerName,
              callerAvatar: msg.callerAvatar,
              callType: msg.callType, // 'audio' | 'video'
              offer: msg.offer,
            }));
          } else {
            // Target user is offline
            ws.send(JSON.stringify({ type: 'call-failed', reason: 'User is offline' }));
          }
          return;
        }

        // Call answer: callee → server → caller
        if (msg.type === 'call-answer') {
          const target = userConnections.get(msg.targetUserId);
          if (target && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(JSON.stringify({
              type: 'call-answered',
              from: userId,
              answer: msg.answer,
            }));
          }
          return;
        }

        // ICE candidate relay
        if (msg.type === 'ice-candidate') {
          const target = userConnections.get(msg.targetUserId);
          if (target && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(JSON.stringify({
              type: 'ice-candidate',
              from: userId,
              candidate: msg.candidate,
            }));
          }
          return;
        }

        // Call end
        if (msg.type === 'call-end') {
          const target = userConnections.get(msg.targetUserId);
          if (target && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(JSON.stringify({ type: 'call-ended', from: userId }));
          }
          return;
        }

        // Call reject
        if (msg.type === 'call-reject') {
          const target = userConnections.get(msg.targetUserId);
          if (target && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(JSON.stringify({ type: 'call-rejected', from: userId }));
          }
          return;
        }

      } catch {
        // Not JSON – ignore
      }
    });

    ws.on('close', () => { if (userId) userConnections.delete(userId); });
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
      if (userId) userConnections.delete(userId);
    });
  });

  return wss;
}
