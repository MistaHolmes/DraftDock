const { Router } = require('express');
const router = Router();

// GET /api/admin/check — returns admin profile
router.get('/', (req, res) => {
  const user = req.adminUser;
  return res.json({
    isAdmin: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      bio: user.bio,
      profilePicture: user.profilePicture,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

module.exports = router;
