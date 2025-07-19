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

// Serve frontend static files from ./frontend folder
app.use(express.static(path.join(__dirname, 'frontend')));

// Folder kubikamo amafoto yoherejwe
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer config kubika amafoto
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Multer fields (ama foto menshi)
const upload = multer({ storage }).fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 },
  { name: 'paymentScreenshot', maxCount: 1 },
]);

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,  // email yawe muri .env
    pass: process.env.MAIL_PASS   // password / app password muri .env
  }
});

// API route - kwakira form yoherejwe na frontend
app.post('/tree_signup', (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: 'Error uploading files.', error: err.message });

    const {
      firstName, lastName, district, sector, cell, village,
      idNumber, amount, username, password,
      referralId, referrerFirstName, referrerLastName
    } = req.body;

    // Check required fields
    if (!firstName || !lastName || !district || !sector || !cell || !village || !idNumber || !username || !password) {
      return res.status(400).json({ message: 'Please fill all required fields!' });
    }

    const profilePhoto = req.files['profilePhoto'] ? req.files['profilePhoto'][0] : null;
    const idFront = req.files['idFront'] ? req.files['idFront'][0] : null;
    const idBack = req.files['idBack'] ? req.files['idBack'][0] : null;
    const paymentScreenshot = req.files['paymentScreenshot'] ? req.files['paymentScreenshot'][0] : null;

    if (!profilePhoto || !idFront || !idBack || !paymentScreenshot) {
      return res.status(400).json({ message: 'All required images must be uploaded!' });
    }

    // Generate Referral ID niba idatanzwe
    let generatedReferralId = referralId;
    if (!referralId) {
      generatedReferralId = `KEDI${Date.now().toString().slice(-6)}`;
    }

    // Email content
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER, // wohereza email ku email yawe
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

      // Optional: gusiba amafoto uploaded nyuma yo kohereza email
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

// Serve index.html on any GET request (for SPA or simple website)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
