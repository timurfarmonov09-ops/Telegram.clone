const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
let db = null;

const initializeProfileRoutes = (database) => {
  db = database;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// GET /api/profile/me
router.get('/me', async (req, res) => {
  try {
    const user = await db.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, data: { user: userWithoutPassword } });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

// PUT /api/profile/update
router.put('/update', async (req, res) => {
  try {
    const { firstName, lastName, bio } = req.body;
    const updateData = {};
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (bio !== undefined) updateData.bio = bio;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const user = await db.updateUser(req.user.userId, updateData);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, message: 'Profile updated successfully', data: { user: userWithoutPassword } });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// PUT /api/profile/photo
router.put('/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const user = await db.findUserById(req.user.userId);
    if (user && user.avatar) {
      const oldPath = path.join(__dirname, '../uploads/avatars', path.basename(user.avatar));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const updatedUser = await db.updateUser(req.user.userId, { avatar: avatarUrl });
    const { password, ...userWithoutPassword } = updatedUser;

    res.json({ success: true, message: 'Profile photo updated', data: { user: userWithoutPassword, avatarUrl } });
  } catch (error) {
    console.error('Upload photo error:', error);
    if (req.file) {
      const filePath = path.join(__dirname, '../uploads/avatars', req.file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.status(500).json({ success: false, error: 'Failed to upload photo' });
  }
});

// DELETE /api/profile/photo
router.delete('/photo', async (req, res) => {
  try {
    const user = await db.findUserById(req.user.userId);
    if (user && user.avatar) {
      const avatarPath = path.join(__dirname, '../uploads/avatars', path.basename(user.avatar));
      if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
      
      const updatedUser = await db.updateUser(req.user.userId, { avatar: null });
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ success: true, message: 'Profile photo deleted', data: { user: userWithoutPassword } });
    } else {
      res.status(404).json({ success: false, error: 'No profile photo to delete' });
    }
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete photo' });
  }
});

module.exports = { router, initializeProfileRoutes };
