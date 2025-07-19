const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Home route for API status
app.get('/', (req, res) => {
  res.send('✅ KEDI Money Network API is running');
});

// POST route to handle form submission
app.post('/submit-form', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'idFrontPhoto', maxCount: 1 },
  { name: 'idBackPhoto', maxCount: 1 },
  { name: 'paymentProof', maxCount: 1 },
]), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      address,
      idNumber,
      amount,
      username,
      password,
      referrerID,
      referrerNames
    } = req.body;

    // File attachments
    const attachments = [];

    const addAttachment = (field, filename) => {
      if (req.files[field]) {
        attachments.push({
          filename,
          content: req.files[field][0].buffer
        });
      }
    };

    addAttachment('profilePhoto', 'profile.jpg');
    addAttachment('idFrontPhoto', 'id-front.jpg');
    addAttachment('idBackPhoto', 'id-back.jpg');
    addAttachment('paymentProof', 'payment.jpg');

    // Email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // in .env
        pass: process.env.EMAIL_PASS  // in .env
      }
    });

    // Email content
    const mailOptions = {
      from: `"KEDI Money Network" <${process.env.EMAIL_USER}>`,
      to: 'kedimoneynetwork@gmail.com',
      subject: '🌳 New Tree Plan Registration',
      html: `
        <h2>🌱 Tree Plan Registration</h2>
        <p><strong>Full Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>ID/Passport:</strong> ${idNumber}</p>
        <p><strong>Amount Paid:</strong> ${amount}</p>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p><strong>Referrer ID:</strong> ${referrerID || 'None'}</p>
        <p><strong>Referrer Names:</strong> ${referrerNames || 'None'}</p>
        <p>🖼 Attached files: profile photo, ID front, ID back, payment proof.</p>
      `,
      attachments
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Form submitted successfully!' });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
