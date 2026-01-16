const express = require('express');
const User = require('../models/UserModel');

const router = express.Router();

// GET /api/users/search - Search users by username or phone
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.json({
        success: true,
        data: {
          users: []
        }
      });
    }

    // Search users by username or phone, exclude current user
    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { phone_number: { $regex: query, $options: 'i' } },
            { first_name: { $regex: query, $options: 'i' } },
            { last_name: { $regex: query, $options: 'i' } }
          ]
        },
        { _id: { $ne: req.user.userId } }
      ]
    })
    .select('username first_name last_name avatar bio phone_number isOnline lastSeen')
    .limit(10);

    res.json({
      success: true,
      data: {
        users: users.map(user => user.toJSON())
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username first_name last_name avatar bio phone_number');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

module.exports = router;
