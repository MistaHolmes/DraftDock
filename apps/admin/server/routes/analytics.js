const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = Router();

// GET /api/admin/analytics/overview
router.get('/overview', async (req, res) => {
  try {
    const [totalUsers, totalBlogs, totalViewsAgg, draftsCount, totalComments] = await Promise.all([
      prisma.user.count(),
      prisma.blog.count({ where: { published: true } }),
      prisma.blog.aggregate({ _sum: { views: true } }),
      prisma.blog.count({ where: { published: false } }),
      prisma.comment.count(),
    ]);

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

    const [newUsersMonth, prevUsersMonth, newBlogsMonth, prevBlogsMonth] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: oneMonthAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo } } }),
      prisma.blog.count({ where: { published: true, createdAt: { gte: oneMonthAgo } } }),
      prisma.blog.count({ where: { published: true, createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo } } }),
    ]);

    const userGrowth = prevUsersMonth > 0
      ? (((newUsersMonth - prevUsersMonth) / prevUsersMonth) * 100).toFixed(1)
      : newUsersMonth > 0 ? '100.0' : '0.0';
    const blogGrowth = prevBlogsMonth > 0
      ? (((newBlogsMonth - prevBlogsMonth) / prevBlogsMonth) * 100).toFixed(1)
      : newBlogsMonth > 0 ? '100.0' : '0.0';

    return res.json({
      totalUsers,
      totalBlogs,
      totalViews: totalViewsAgg._sum.views || 0,
      draftsCount,
      totalComments,
      newUsersMonth,
      newBlogsMonth,
      userGrowth: parseFloat(userGrowth),
      blogGrowth: parseFloat(blogGrowth),
    });
  } catch (err) {
    console.error('Analytics overview error:', err);
    return res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// GET /api/admin/analytics/views-over-time?days=7
router.get('/views-over-time', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const results = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const viewsAgg = await prisma.blog.aggregate({
        where: { published: true, createdAt: { gte: date, lt: nextDate } },
        _sum: { views: true },
      });

      // Also check DailyViewStat if available
      const dailyViews = await prisma.dailyViewStat.aggregate({
        where: { date: { gte: date, lt: nextDate } },
        _sum: { views: true },
      });

      const totalDayViews = (dailyViews._sum.views || 0) + (viewsAgg._sum.views || 0);

      results.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        views: totalDayViews,
      });
    }

    return res.json({ data: results });
  } catch (err) {
    console.error('Views over time error:', err);
    return res.status(500).json({ error: 'Failed to fetch view data' });
  }
});

// GET /api/admin/analytics/top-tags
router.get('/top-tags', async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      include: { _count: { select: { blogs: true } } },
      orderBy: { blogs: { _count: 'desc' } },
      take: 10,
    });

    const result = tags.map(t => ({
      id: t.id,
      name: t.name,
      blogCount: t._count.blogs,
    }));

    return res.json({ tags: result });
  } catch (err) {
    console.error('Top tags error:', err);
    return res.status(500).json({ error: 'Failed to fetch top tags' });
  }
});

// GET /api/admin/analytics/top-authors
router.get('/top-authors', async (req, res) => {
  try {
    const authors = await prisma.user.findMany({
      where: { blogs: { some: { published: true } } },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        _count: { select: { blogs: true } },
      },
      take: 5,
    });

    // Get total views for each
    const authorsWithViews = await Promise.all(
      authors.map(async (author) => {
        const agg = await prisma.blog.aggregate({
          where: { authorId: author.id, published: true },
          _sum: { views: true },
        });
        return { ...author, totalViews: agg._sum.views || 0 };
      })
    );

    // Sort by views descending
    authorsWithViews.sort((a, b) => b.totalViews - a.totalViews);

    return res.json({ authors: authorsWithViews });
  } catch (err) {
    console.error('Top authors error:', err);
    return res.status(500).json({ error: 'Failed to fetch top authors' });
  }
});

// GET /api/admin/analytics/recent-activity
router.get('/recent-activity', async (req, res) => {
  try {
    const [recentUsers, recentBlogs] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, email: true, name: true, createdAt: true },
      }),
      prisma.blog.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, title: true, createdAt: true,
          author: { select: { name: true, email: true } },
          tags: { select: { name: true }, take: 1 },
        },
      }),
    ]);

    const activity = [
      ...recentUsers.map(u => ({
        type: 'user_joined',
        message: `${u.name || u.email} joined the platform`,
        timestamp: u.createdAt,
        icon: 'person_add',
        color: 'green',
      })),
      ...recentBlogs.map(b => ({
        type: 'blog_published',
        message: `"${b.title}"`,
        author: b.author.name || b.author.email,
        tag: b.tags[0]?.name || 'General',
        timestamp: b.createdAt,
        icon: 'check_circle',
        color: 'green',
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    return res.json({ activity });
  } catch (err) {
    console.error('Recent activity error:', err);
    return res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

module.exports = router;
