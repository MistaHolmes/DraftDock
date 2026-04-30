import prisma from "./prisma";
import { broadcastNotificationUpdate, invalidatePublicBlogsCache, invalidateUserBlogsCache } from "./websocket";

/**
 * Checks for blogs that are scheduled for publication and whose
 * scheduled time has passed.
 */
export async function processScheduledBlogs() {
  try {
    const now = new Date();

    const toPublish = await prisma.blog.findMany({
      where: {
        published: false,
        scheduledAt: {
          not: null,
          lte: now,
        },
      },
      include: {
        author: true,
      },
    });

    if (toPublish.length === 0) return;

    console.log(`[Scheduler] Found ${toPublish.length} blogs to publish.`);

    for (const blog of toPublish) {
      try {
        await prisma.blog.update({
          where: { id: blog.id },
          data: {
            published: true,
            scheduledAt: null,
          },
        });

        await prisma.notification.create({
          data: {
            userId: blog.authorId,
            message: `Your scheduled blog "${blog.title}" is now live!`,
          },
        });

        // Invalidate caches so the new blog appears immediately
        await invalidatePublicBlogsCache();
        await invalidateUserBlogsCache(blog.authorId);

        // Notify the author via WS
        broadcastNotificationUpdate(blog.authorId);

        console.log(`[Scheduler] Published: ${blog.title} (${blog.id})`);
      } catch (blogErr) {
        // Log individual blog publish errors but continue with the rest
        console.error(`[Scheduler] Failed to publish blog ${blog.id}:`, blogErr);
      }
    }
  } catch (error) {
    console.error("[Scheduler] Error processing scheduled blogs:", error);
  }
}

/**
 * Starts a simple interval-based scheduler.
 */
export function initScheduler(intervalMs: number = 60000) {
  console.log(`[Scheduler] Initialized with interval ${intervalMs}ms`);
  // Run once immediately on startup (after a short delay for DB to be ready)
  setTimeout(processScheduledBlogs, 5000);
  setInterval(processScheduledBlogs, intervalMs);
}
