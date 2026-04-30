const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = Router();

// GET /api/admin/users — paginated user list
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const roleFilter = req.query.role || '';
    const skip = (page - 1) * limit;

    const where = {};
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
          bio: true,
          _count: { select: { blogs: true, comments: true, followers: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Get total views for each user
    const usersWithViews = await Promise.all(
      users.map(async (user) => {
        const viewsAgg = await prisma.blog.aggregate({
          where: { authorId: user.id },
          _sum: { views: true },
        });
        return { ...user, totalViews: viewsAgg._sum.views || 0 };
      })
    );

    return res.json({
      users: usersWithViews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Users list error:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id — detailed user info
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { blogs: true, comments: true, followers: true, following: true } },
        blogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, title: true, published: true, views: true, createdAt: true },
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const viewsAgg = await prisma.blog.aggregate({
      where: { authorId: user.id },
      _sum: { views: true },
    });

    return res.json({ ...user, totalViews: viewsAgg._sum.views || 0 });
  } catch (err) {
    console.error('User detail error:', err);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PATCH /api/admin/users/:id/role — change role
router.patch('/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['ADMIN', 'AUTHOR', 'CONTRIBUTOR'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
    return res.json({ message: `Role updated to ${role}`, user: updated });
  } catch (err) {
    console.error('Role change error:', err);
    return res.status(500).json({ error: 'Failed to update role' });
  }
});

// PATCH /api/admin/users/:id/verify — toggle verified
router.patch('/:id/verify', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified: !user.isVerified },
      select: { id: true, email: true, name: true, isVerified: true },
    });
    return res.json({ message: `User ${updated.isVerified ? 'verified' : 'unverified'}`, user: updated });
  } catch (err) {
    console.error('Verify toggle error:', err);
    return res.status(500).json({ error: 'Failed to toggle verification' });
  }
});

module.exports = router;
