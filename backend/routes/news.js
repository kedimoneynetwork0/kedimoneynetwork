const express = require('express');
const multer = require('multer');
const path = require('path');
const { query } = require('../utils/database');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/') ||
        file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image, video, and PDF files are allowed!'));
    }
  }
});

// Get all news (public)
router.get('/', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM news ORDER BY created_at DESC`);
    const rows = result.rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create news (admin only)
router.post('/', adminMiddleware, upload.single('media'), async (req, res) => {
  const { title, content } = req.body;
  const author = req.user.id;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  let mediaUrl = null;
  let mediaType = null;

  if (req.file) {
    mediaUrl = `/uploads/${req.file.filename}`;
    mediaType = req.file.mimetype.split('/')[0];
  }

  try {
    const result = await query(
      `INSERT INTO news (title, content, media_url, media_type, author) VALUES ($1, $2, $3, $4, $5)`,
      [title, content, mediaUrl, mediaType, author]
    );
    res.json({ message: 'News created successfully', id: result.lastID });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update news (admin only)
router.put('/:id', adminMiddleware, upload.single('media'), async (req, res) => {
  const newsId = req.params.id;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  let mediaUrl = null;
  let mediaType = null;

  if (req.file) {
    mediaUrl = `/uploads/${req.file.filename}`;
    mediaType = req.file.mimetype.split('/')[0];
  }

  try {
    if (req.file) {
      await query(
        `UPDATE news SET title = $1, content = $2, media_url = $3, media_type = $4 WHERE id = $5`,
        [title, content, mediaUrl, mediaType, newsId]
      );
    } else {
      await query(
        `UPDATE news SET title = $1, content = $2 WHERE id = $3`,
        [title, content, newsId]
      );
    }
    res.json({ message: 'News updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete news (admin only)
router.delete('/:id', adminMiddleware, async (req, res) => {
  const newsId = req.params.id;
  try {
    await query(`DELETE FROM news WHERE id = $1`, [newsId]);
    res.json({ message: 'News deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;