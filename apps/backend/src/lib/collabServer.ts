/**
 * Hocuspocus Collaboration Server
 *
 * Runs on a dedicated port (default 3002) and provides Yjs CRDT document
 * synchronisation over WebSocket.  Handles authentication (Clerk JWT +
 * invite-token validation), document loading/persistence via Redis + Postgres,
 * and session tracking.
 */

import { Server as HocuspocusServer } from '@hocuspocus/server';
import type { Hocuspocus } from '@hocuspocus/server';
import * as Y from 'yjs';
import { clerkClient } from '@clerk/express';
import prisma from './prisma';
import redisClient from './redis';
import { broadcastNotificationUpdate } from './websocket';
import { ydocToMarkdown } from './ydocToContent';

// ── Redis key helpers ────────────────────────────────────────────────────────
const ydocKey   = (blogId: string) => `collab:ydoc:${blogId}`;
const activeKey = (blogId: string) => `collab:active:${blogId}`;

// ── Resolve Clerk user ID → internal DB user ────────────────────────────────
async function resolveDbUser(clerkUserId: string): Promise<{ id: string; email: string } | null> {
  try {
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) return null;
    const dbUser = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
    return dbUser;
  } catch {
    return null;
  }
}

// ── Hocuspocus instance ──────────────────────────────────────────────────────
let hocuspocusInstance: HocuspocusServer | null = null;

export function getHocuspocus(): Hocuspocus {
  if (!hocuspocusInstance) throw new Error('Hocuspocus not initialised');
  return hocuspocusInstance.hocuspocus;
}

export function initCollabServer(port: number = 3002): HocuspocusServer {
  const server = new HocuspocusServer({
    port,
    address: '0.0.0.0',
    name: 'DraftDock-Collab',

    // ── Authentication ────────────────────────────────────────────────
    async onAuthenticate(data: any) {
      const { token, documentName: blogId } = data;
      if (!token) throw new Error('Token required');

      let dbUserId: string | null = null;

      // 1. Try Clerk JWT (logged-in user)
      try {
        const [, payloadB64] = token.split('.');
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
        if (payload.sub) {
          // Resolve Clerk user ID → internal DB user ID via email
          const dbUser = await resolveDbUser(payload.sub);
          if (dbUser) dbUserId = dbUser.id;
        }
      } catch { /* not a Clerk JWT – try invite token below */ }

      // 2. If not resolved as a Clerk user, try invite-token (shared link guest)
      if (!dbUserId) {
        const invite = await prisma.collabInviteToken.findUnique({
          where: { token },
          include: { creator: true },
        });

        if (!invite) throw new Error('Unauthorized');
        if (invite.status !== 'ACTIVE') throw new Error('Token revoked or expired');
        if (invite.expiresAt < new Date()) {
          await prisma.collabInviteToken.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } });
          throw new Error('Token expired');
        }
        if (invite.uses >= invite.maxUses) throw new Error('Token usage limit reached');
        if (invite.blogId !== blogId) throw new Error('Token does not match document');

        await prisma.collabInviteToken.update({ where: { id: invite.id }, data: { uses: { increment: 1 } } });
        dbUserId = invite.creatorId;
      }

      if (!dbUserId) throw new Error('Unauthorized');

      // 3. Gate: must be the blog author or an accepted co-author
      const blog = await prisma.blog.findUnique({ where: { id: blogId } });
      if (!blog) throw new Error('Blog not found');

      if (blog.authorId !== dbUserId) {
        const coAuthor = await (prisma as any).coAuthor.findFirst({
          where: { blogId, userId: dbUserId, status: 'ACCEPTED' },
        });
        if (!coAuthor) {
          console.log(`[onAuthenticate] Rejected user ${dbUserId} for blog ${blogId}`);
          throw new Error('Not a collaborator on this blog');
        }
      }

      console.log(`[onAuthenticate] Allowed user ${dbUserId} on blog ${blogId}`);
      return { userId: dbUserId };
    },

    // ── Load document ─────────────────────────────────────────────────
    async onLoadDocument(data: any) {
      const blogId = data.documentName;

      // 1. Try Redis (hot cache)
      try {
        const cached = await redisClient.get(ydocKey(blogId));
        if (cached) {
          const update = Buffer.from(cached, 'base64');
          Y.applyUpdate(data.document, new Uint8Array(update));
          console.log(`[Collab] Loaded Y.Doc for ${blogId} from Redis`);
          return data.document;
        }
      } catch {}

      // 2. Try Postgres ydocState
      const blog = await prisma.blog.findUnique({
        where: { id: blogId },
        select: { ydocState: true, content: true },
      });

      if (blog?.ydocState) {
        Y.applyUpdate(data.document, new Uint8Array(blog.ydocState));
        console.log(`[Collab] Loaded Y.Doc for ${blogId} from Postgres`);
        return data.document;
      }

      // 3. Seed from existing blog content (first time opening collab)
      if (blog?.content) {
        const ytext = data.document.getText('content');
        ytext.insert(0, blog.content);
      }
      // Also seed title
      const titleText = data.document.getText('title');
      if (titleText.length === 0) {
        const blogForTitle = await prisma.blog.findUnique({ where: { id: blogId }, select: { title: true } });
        if (blogForTitle?.title) {
          titleText.insert(0, blogForTitle.title);
        }
      }
      if (blog?.content) {
        console.log(`[Collab] Seeded Y.Doc for ${blogId}`);
      }

      return data.document;
    },

    // ── Persist document ──────────────────────────────────────────────
    async onStoreDocument(data: any) {
      const blogId = data.documentName;
      const update = Y.encodeStateAsUpdate(data.document);
      const b64 = Buffer.from(update).toString('base64');

      // Write to Redis (fast reconnect)
      try {
        await redisClient.set(ydocKey(blogId), b64, { EX: 86400 });
      } catch {}

      // Write binary to Postgres
      try {
        await prisma.blog.update({
          where: { id: blogId },
          data: { ydocState: Buffer.from(update) },
        });

        // Also save content and title for non-collab readers
        const plainContent = ydocToMarkdown(data.document);
        const ytitle = data.document.getText('title');
        const plainTitle = ytitle.toJSON();
        const updatePayload: { content?: string; title?: string } = {};
        if (plainContent) updatePayload.content = plainContent;
        if (plainTitle)   updatePayload.title   = plainTitle;
        if (Object.keys(updatePayload).length) {
          await prisma.blog.update({ where: { id: blogId }, data: updatePayload });
        }

        // Create a blog version snapshot (race-safe: use max instead of count)
        const agg = await prisma.blogVersion.aggregate({ where: { blogId }, _max: { version: true } });
        const nextVersion = (agg._max.version ?? 0) + 1;
        const blogTitle = (await prisma.blog.findUnique({ where: { id: blogId }, select: { title: true } }))?.title || 'Untitled';
        try {
          await prisma.blogVersion.create({
            data: { blogId, title: blogTitle, content: plainContent, version: nextVersion },
          });
          console.log(`[Collab] Persisted Y.Doc for ${blogId} (version ${nextVersion})`);
        } catch (vErr: any) {
          if (vErr?.code === 'P2002') {
            console.warn(`[Collab] Version conflict for ${blogId} v${nextVersion}, skipping snapshot`);
          } else {
            throw vErr;
          }
        }
      } catch (err) {
        console.error(`[Collab] Failed to persist Y.Doc for ${blogId}:`, err);
      }
    },

    // ── Connection lifecycle ──────────────────────────────────────────
    async onConnect(data: any) {
      const blogId = data.documentName;

      // Mark session active in Redis
      try { await redisClient.set(activeKey(blogId), '1', { EX: 86400 }); } catch {}

      // Track session in DB
      const context = data.context as any;
      if (context?.userId) {
        try {
          await prisma.collabSession.create({
            data: { blogId, userId: context.userId },
          });
        } catch {}

        // Notify blog owner
        const blog = await prisma.blog.findUnique({ where: { id: blogId }, select: { authorId: true, title: true } });
        if (blog && blog.authorId !== context.userId) {
          const joiner = await prisma.user.findUnique({ where: { id: context.userId }, select: { name: true, email: true } });
          await prisma.notification.create({
            data: {
              userId: blog.authorId,
              message: `${joiner?.name || joiner?.email || 'Someone'} joined your collab session on "${blog.title}"`,
            },
          });
          await broadcastNotificationUpdate(blog.authorId);
        }
      }
    },

    async onDisconnect(data: any) {
      const context = data.context as any;
      if (context?.userId) {
        // Mark session ended
        try {
          const session = await prisma.collabSession.findFirst({
            where: { blogId: data.documentName, userId: context.userId, leftAt: null },
            orderBy: { joinedAt: 'desc' },
          });
          if (session) {
            await prisma.collabSession.update({
              where: { id: session.id },
              data: { leftAt: new Date() },
            });
          }
        } catch {}
      }
    },
  });

  hocuspocusInstance = server;
  console.log(`[Collab] Hocuspocus server starting on port ${port}`);

  // Server.listen() returns a promise – fire and forget to avoid blocking
  server.listen(port).catch((err: Error) => {
    console.error('[Collab] Failed to start Hocuspocus:', err);
  });

  return server;
}
