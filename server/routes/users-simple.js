const express = require('express');
const router = express.Router();

let db = null;

const initializeUserRoutes = (database) => {
  db = database;
};

// GET /api/users/search
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.json({ success: true, data: { users: [] } });
    }

    const users = await db.searchUsers(query, req.user.userId);
    
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({ success: true, data: { users: sanitizedUsers } });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, error: 'Failed to search users' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await db.findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, data: { user: userWithoutPassword } });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

module.exports = { router, initializeUserRoutes };
