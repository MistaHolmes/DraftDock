import prisma from "../lib/prisma";
import { broadcastNotificationUpdate } from "../lib/websocket";

export async function checkAndAwardAchievements(userId: string) {
  try {
    const user = await (prisma.user as any).findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            blogs: true,
            comments: true,
            followers: true,
            readingHistory: true
          }
        }
      }
    });

    if (!user) return;

    const publishedBlogs = await prisma.blog.count({ where: { authorId: userId, published: true } });

    // Define Achievement IDs
    const achievements = await (prisma.achievement as any).findMany();
    const userAchievements = await (prisma.userAchievement as any).findMany({ where: { userId } });
    const awardedIds = new Set((userAchievements as any[]).map(ua => ua.achievementId));

    const toAward: string[] = [];

    // 1. First Word (1 Published Blog)
    const firstWord = (achievements as any[]).find(a => a.name === "First Word");
    if (firstWord && publishedBlogs >= 1 && !awardedIds.has(firstWord.id)) {
      toAward.push(firstWord.id);
    }

    // 2. Community Pillar (10 comments received)
    const receivedComments = await prisma.comment.count({ where: { blog: { authorId: userId } } });
    const communityPillar = (achievements as any[]).find(a => a.name === "Community Pillar");
    if (communityPillar && receivedComments >= 10 && !awardedIds.has(communityPillar.id)) {
      toAward.push(communityPillar.id);
    }

    // 3. Binge Reader (10 Read Blogs)
    const bingeReader = (achievements as any[]).find(a => a.name === "Binge Reader");
    if (bingeReader && (user as any)._count.readingHistory >= 10 && !awardedIds.has(bingeReader.id)) {
      toAward.push(bingeReader.id);
    }

    // 4. Rising Star (50 Followers)
    const risingStar = (achievements as any[]).find(a => a.name === "Rising Star");
    if (risingStar && (user as any)._count.followers >= 50 && !awardedIds.has(risingStar.id)) {
      toAward.push(risingStar.id);
    }

    // Award achievements
    for (const achievementId of toAward) {
      const achievement = (achievements as any[]).find(a => a.id === achievementId);
      await (prisma.userAchievement as any).create({
        data: { userId, achievementId }
      });

      // Update User XP
      await prisma.user.update({
        where: { id: userId },
        data: {
          writerXP: { increment: achievement?.xpReward || 50 } as any
        }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId,
          message: `🏆 Achievement Unlocked: ${achievement?.name}! You earned ${achievement?.xpReward} XP.`
        }
      });

      broadcastNotificationUpdate(userId);
      console.log(`[Achievement] Awarded "${achievement?.name}" to user ${userId}`);
    }
  } catch (err) {
    console.error("Error checking achievements:", err);
  }
}
