const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files from ../frontend folder
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Create uploads directory if not exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer config for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Accept these file fields only
const upload = multer({ storage }).fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 },
  { name: 'paymentScreenshot', maxCount: 1 },
]);

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER, // example: youremail@gmail.com
    pass: process.env.MAIL_PASS  // app password or your email password
  }
});

// POST /tree_signup route to handle form submission
app.post('/tree_signup', (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: 'Error uploading files.', error: err.message });

    const {
      firstName, lastName, district, sector, cell, village,
      idNumber, amount, username, password,
      referralId, referrerFirstName, referrerLastName
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !district || !sector || !cell || !village || !idNumber || !username || !password) {
      return res.status(400).json({ message: 'Please fill all required fields!' });
    }

    // Check uploaded files
    const profilePhoto = req.files['profilePhoto'] ? req.files['profilePhoto'][0] : null;
    const idFront = req.files['idFront'] ? req.files['idFront'][0] : null;
    const idBack = req.files['idBack'] ? req.files['idBack'][0] : null;
    const paymentScreenshot = req.files['paymentScreenshot'] ? req.files['paymentScreenshot'][0] : null;

    if (!profilePhoto || !idFront || !idBack || !paymentScreenshot) {
      return res.status(400).json({ message: 'All required images must be uploaded!' });
    }

    // Generate referral ID if not provided
    let generatedReferralId = referralId;
    if (!referralId) {
      generatedReferralId = `KEDI${Date.now().toString().slice(-6)}`;
    }

    // Prepare email content
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER, // send to yourself
      subject: `New Tree Plan Signup - ${firstName} ${lastName}`,
      html: `
        <h2>Tree Plan Signup Details</h2>
        <p><b>First Name:</b> ${firstName}</p>
        <p><b>Last Name:</b> ${lastName}</p>
        <p><b>Akarere:</b> ${district}</p>
        <p><b>Umurenge:</b> ${sector}</p>
        <p><b>Akagari:</b> ${cell}</p>
        <p><b>Umudugudu:</b> ${village}</p>
        <p><b>ID/Passport Number:</b> ${idNumber}</p>
        <p><b>Amount:</b> ${amount || '10100'} FRW</p>
        <p><b>Username:</b> ${username}</p>
        <p><b>Password:</b> ${password}</p>
        <p><b>Referral ID:</b> ${generatedReferralId}</p>
        <p><b>Referrer First Name:</b> ${referrerFirstName || 'N/A'}</p>
        <p><b>Referrer Last Name:</b> ${referrerLastName || 'N/A'}</p>
      `,
      attachments: [
        { filename: profilePhoto.originalname, path: profilePhoto.path },
        { filename: idFront.originalname, path: idFront.path },
        { filename: idBack.originalname, path: idBack.path },
        { filename: paymentScreenshot.originalname, path: paymentScreenshot.path }
      ]
    };

    try {
      await transporter.sendMail(mailOptions);

      // Optionally delete uploaded files after sending email
      // fs.unlinkSync(profilePhoto.path);
      // fs.unlinkSync(idFront.path);
      // fs.unlinkSync(idBack.path);
      // fs.unlinkSync(paymentScreenshot.path);

      return res.status(200).json({ message: 'Signup successful!', referralId: generatedReferralId });
    } catch (error) {
      console.error('Email sending error:', error);
      return res.status(500).json({ message: 'Failed to send email.' });
    }
  });
});

// Serve index.html for all other GET requests (for SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
