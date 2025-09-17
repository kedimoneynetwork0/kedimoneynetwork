const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import SQLite database
const { query, run } = require('./utils/database-sqlite');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Static file serving
app.use('/uploads', express.static(uploadsDir));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// News routes
app.get('/api/news', async (req, res) => {
  try {
    const result = await query('SELECT * FROM news ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ message: 'Error fetching news' });
  }
});

app.post('/api/news', authenticateToken, upload.single('media'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const media_url = req.file ? `/uploads/${req.file.filename}` : null;
    const media_type = req.file ? req.file.mimetype.split('/')[0] : null;

    const result = await run(
      'INSERT INTO news (title, content, media_url, media_type) VALUES (?, ?, ?, ?)',
      [title, content, media_url, media_type]
    );

    res.status(201).json({
      id: result.lastID,
      title,
      content,
      media_url,
      media_type,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ message: 'Error creating news' });
  }
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query('SELECT * FROM users WHERE email = ?', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email !== (process.env.ADMIN_EMAIL || 'kedimoneynetwork@gmail.com')) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, process.env.ADMIN_PASSWORD || 'AdminPass123!@#');

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { email, role: 'admin' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Admin login failed' });
  }
});

// Seed admin user
const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'kedimoneynetwork@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!@#';

    const existingAdmin = await query('SELECT * FROM users WHERE email = ?', [adminEmail]);

    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await run(
        'INSERT INTO users (firstname, lastname, email, username, password, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['Admin', 'User', adminEmail, 'admin', hashedPassword, 'admin', 'approved']
      );
      console.log('Admin user seeded successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};

// Initialize and start server
const startServer = async () => {
  try {
    await seedAdmin();
    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

startServer();