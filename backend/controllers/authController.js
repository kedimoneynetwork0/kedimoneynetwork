const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  const { fullName, email, phone, password, paymentMethod, txnId, referredBy } = req.body;

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email yamaze kwiyandikwa.' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate referral code (simple unique string)
    const referralCode = `KEDI${Math.floor(100000 + Math.random() * 900000)}`;

    const newUser = new User({
      fullName,
      email,
      phone,
      password: hashedPassword,
      paymentMethod,
      txnId,
      referredBy: referredBy || null,
      referralCode,
      isApproved: false,
      isAdmin: false
    });

    await newUser.save();
    res.status(201).json({ message: 'Kwiyandikisha byagenze neza. Tegereza kwemererwa na admin.' });
  } catch (error) {
    res.status(500).json({ message: 'Habaye ikosa muri signup.', error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email ntibonetse.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Ijambo ry’ibanga si ryo.' });

    if (!user.isApproved) {
      return res.status(403).json({ message: 'Admin ntarabemeza.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Habaye ikosa muri login.', error: error.message });
  }
};
