const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Signup route
router.post('/signup', async (req, res) => {
  const { fullName, email, phone, password, paymentMethod, transactionId } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email yamaze kwiyandikwa.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email,
      phone,
      password: hashedPassword,
      paymentMethod,
      transactionId,
      status: 'pending'
    });

    await newUser.save();
    res.status(201).json({ message: 'Kwiyandikisha byagenze neza. Tegereza kwemererwa na admin.' });
  } catch (err) {
    res.status(500).json({ message: 'Habaye ikosa muri signup.', error: err.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email ntibonetse.' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: 'Ijambo ry’ibanga si ryo.' });

    if (user.status !== 'approved') {
      return res.status(403).json({ message: 'Admin ntarabemeza.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Habaye ikosa muri login.', error: err.message });
  }
});

module.exports = router;
