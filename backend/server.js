const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const User = require('./models/user');

// Load environment variables
dotenv.config();

const app = express(); // ✅ Reba ko iyi line iri mbere y'ibindi byose ukoresha `app`

// Serve frontend static files
app.use('/', express.static(path.join(__dirname, 'frontend')));

// Middlewares
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Generate referral ID
function generateReferralID() {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `KEDI${randomNum}RW`;
}

// Signup route
app.post('/api/signup', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 },
  { name: 'paymentScreenshot', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      firstName, lastName, district, sector, cell, village,
      idNumber, username, password, referralId, referrerFirstName, referrerLastName
    } = req.body;

    const files = req.files;

    if (!files.profilePhoto || !files.idFront || !files.idBack || !files.paymentScreenshot) {
      return res.status(400).json({ message: 'All images are required.' });
    }

    const newUser = new User({
      firstName,
      lastName,
      district,
      sector,
      cell,
      village,
      idNumber,
      username,
      password, // ⚠️ Hash password in production!
      referralId: referralId || generateReferralID(),
      referrerFirstName,
      referrerLastName,
      profilePhoto: files.profilePhoto[0].path,
      idFront: files.idFront[0].path,
      idBack: files.idBack[0].path,
      paymentScreenshot: files.paymentScreenshot[0].path,
      amount: 10100,
      status: 'pending'
    });

    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully!',
      referralId: newUser.referralId
    });

  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
