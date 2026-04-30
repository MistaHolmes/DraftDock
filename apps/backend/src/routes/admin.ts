import { Router } from 'express';
import { requireAuth } from '@clerk/express';
import prisma from '../lib/prisma';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth());
router.use(requireAdmin());

// ── GET /api/admin/stats — Platform-wide statistics ──────────────────────────
router.get('/stats', async (req, res: any) => {
  try {
    const [totalUsers, totalBlogs, totalComments, totalViews] = await Promise.all([
      prisma.user.count(),
      prisma.blog.count({ where: { published: true } }),
      prisma.comment.count(),
      prisma.blog.aggregate({ _sum: { views: true } }),
    ]);

    // New users this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newUsersThisWeek = await prisma.user.count({
      where: { createdAt: { gte: oneWeekAgo } },
    });

    // New blogs this week
    const newBlogsThisWeek = await prisma.blog.count({
      where: { published: true, createdAt: { gte: oneWeekAgo } },
    });

    return res.json({
      totalUsers,
      totalBlogs,
      totalComments,
      totalViews: totalViews._sum.views || 0,
      newUsersThisWeek,
      newBlogsThisWeek,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch platform stats' });
  }
});

// ── GET /api/admin/users — List all users (paginated) ────────────────────────
router.get('/users', async (req, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const roleFilter = (req.query.role as string) || '';
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleFilter && ['ADMIN', 'AUTHOR', 'CONTRIBUTOR'].includes(roleFilter)) {
      where.role = roleFilter;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          profilePicture: true,
          createdAt: true,
          isVerified: true,
          writerLevel: true,
          _count: {
            select: { blogs: true, comments: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Admin list users error:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── GET /api/admin/users/:id — Get detailed user info ────────────────────────
router.get('/users/:id', async (req, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            blogs: true,
            comments: true,
            followers: true,
            following: true,
            bookmarks: true,
            achievements: true,
          },
        },
        blogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            published: true,
            views: true,
            createdAt: true,
            _count: { select: { comments: true } },
          },
        },
        achievements: {
          include: { achievement: true },
          orderBy: { awardedAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Aggregate total views
    const viewsAgg = await prisma.blog.aggregate({
      where: { authorId: user.id },
      _sum: { views: true },
    });

    return res.json({
      ...user,
      totalViews: viewsAgg._sum.views || 0,
    });
  } catch (err) {
    console.error('Admin get user error:', err);
    return res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// ── PATCH /api/admin/users/:id/role — Change user role ───────────────────────
router.patch('/users/:id/role', async (req, res: any) => {
  try {
    const { role } = req.body;
    if (!role || !['ADMIN', 'AUTHOR', 'CONTRIBUTOR'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be ADMIN, AUTHOR, or CONTRIBUTOR.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: role as any },
      select: { id: true, email: true, name: true, role: true },
    });

    return res.json({ message: `User role updated to ${role}`, user: updated });
  } catch (err) {
    console.error('Admin change role error:', err);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
});

// ── GET /api/admin/top-blogs — Top viewed blogs this week ────────────────────
router.get('/top-blogs', async (req, res: any) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { published: true },
      orderBy: { views: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        views: true,
        author: { select: { name: true, email: true } },
      },
    });

    return res.json({ blogs });
  } catch (err) {
    console.error('Admin top blogs error:', err);
    return res.status(500).json({ error: 'Failed to fetch top blogs' });
  }
});

// ── GET /api/admin/recent-activity — Recent platform events ──────────────────
router.get('/recent-activity', async (req, res: any) => {
  try {
    // Get recent users
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, email: true, name: true, createdAt: true },
    });

    // Get recent published blogs
    const recentBlogs = await prisma.blog.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: { select: { name: true, email: true } },
      },
    });

    // Merge and sort by time
    const activity = [
      ...recentUsers.map((u) => ({
        type: 'user_joined' as const,
        message: `${u.name || u.email} joined the platform`,
        timestamp: u.createdAt,
      })),
      ...recentBlogs.map((b) => ({
        type: 'blog_published' as const,
        message: `"${b.title}" published by ${b.author.name || b.author.email}`,
        timestamp: b.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 10);

    return res.json({ activity });
  } catch (err) {
    console.error('Admin recent activity error:', err);
    return res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

// ── GET /api/admin/check — Check if current user is admin ────────────────────
router.get('/check', async (req, res: any) => {
  // If we reach here, the middleware already confirmed admin status
  return res.json({ isAdmin: true, user: (req as any).adminUser });
});

export default router;
