const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = Router();

// GET /api/admin/stats
router.get('/', async (req, res) => {
  try {
    const [totalUsers, totalBlogs, totalComments, totalViewsAgg, draftsCount, tipsAgg, premiumAccesses] = await Promise.all([
      prisma.user.count(),
      prisma.blog.count({ where: { published: true } }),
      prisma.comment.count(),
      prisma.blog.aggregate({ _sum: { views: true } }),
      prisma.blog.count({ where: { published: false } }),
      prisma.tip.aggregate({ _sum: { amountInCents: true } }),
      prisma.premiumAccess.findMany({
        where: { isActive: true },
        include: { subscription: true }
      })
    ]);

    const subscriptionRevenue = premiumAccesses.reduce((acc, access) => acc + (access.subscription?.priceInCents || 0), 0);
    const totalRevenueCents = subscriptionRevenue + (tipsAgg._sum.amountInCents || 0);
    const totalRevenue = totalRevenueCents / 100;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const [newUsersThisWeek, newUsersLastWeek, newBlogsThisWeek, newBlogsLastWeek] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo } } }),
      prisma.blog.count({ where: { published: true, createdAt: { gte: oneWeekAgo } } }),
      prisma.blog.count({ where: { published: true, createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo } } }),
    ]);

    // Calculate growth percentages
    const userGrowth = newUsersLastWeek > 0
      ? (((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100).toFixed(1)
      : newUsersThisWeek > 0 ? '100.0' : '0.0';

    const blogGrowth = newBlogsLastWeek > 0
      ? (((newBlogsThisWeek - newBlogsLastWeek) / newBlogsLastWeek) * 100).toFixed(1)
      : newBlogsThisWeek > 0 ? '100.0' : '0.0';

    return res.json({
      totalUsers,
      totalBlogs,
      totalComments,
      totalViews: totalViewsAgg._sum.views || 0,
      draftsCount,
      totalRevenue,
      newUsersThisWeek,
      newBlogsThisWeek,
      userGrowth: parseFloat(userGrowth),
      blogGrowth: parseFloat(blogGrowth),
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
