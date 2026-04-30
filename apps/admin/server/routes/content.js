const { Router } = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = Router();

// GET /api/admin/content — paginated blogs
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const status = req.query.status || 'all';
    const sort = req.query.sort || 'newest';
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const where = {};
    if (status === 'published') where.published = true;
    else if (status === 'draft') where.published = false;
    else if (status === 'scheduled') where.scheduledAt = { not: null };

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sort === 'views') orderBy = { views: 'desc' };
    else if (sort === 'title') orderBy = { title: 'asc' };

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          published: true,
          featured: true,
          views: true,
          likes: true,
          createdAt: true,
          updatedAt: true,
          scheduledAt: true,
          coverImage: true,
          summary: true,
          author: { select: { id: true, name: true, email: true, profilePicture: true } },
          tags: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.blog.count({ where }),
    ]);

    return res.json({
      blogs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Content list error:', err);
    return res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// GET /api/admin/content/featured
router.get('/featured', async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { featured: true, published: true },
      orderBy: { views: 'desc' },
      take: 6,
      select: {
        id: true,
        title: true,
        views: true,
        likes: true,
        coverImage: true,
        createdAt: true,
        author: { select: { name: true, email: true, profilePicture: true } },
        tags: { select: { name: true } },
      },
    });
    return res.json({ blogs });
  } catch (err) {
    console.error('Featured content error:', err);
    return res.status(500).json({ error: 'Failed to fetch featured content' });
  }
});

// PATCH /api/admin/content/:id/featured — toggle featured
router.patch('/:id/featured', async (req, res) => {
  try {
    const blog = await prisma.blog.findUnique({ where: { id: req.params.id } });
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    const updated = await prisma.blog.update({
      where: { id: req.params.id },
      data: { featured: !blog.featured },
      select: { id: true, title: true, featured: true },
    });
    return res.json({ message: `Blog ${updated.featured ? 'featured' : 'unfeatured'}`, blog: updated });
  } catch (err) {
    console.error('Toggle featured error:', err);
    return res.status(500).json({ error: 'Failed to toggle featured' });
  }
});

// DELETE /api/admin/content/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.blog.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Blog deleted' });
  } catch (err) {
    console.error('Delete content error:', err);
    return res.status(500).json({ error: 'Failed to delete blog' });
  }
});

module.exports = router;
