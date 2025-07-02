// routes/signup.js
const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const router = express.Router();
const path = require('path');

// Upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Helper function yo gukora Referral ID
function generateReferralId() {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // ex: 1234
    return `KEDI${randomNum}RW${Date.now().toString().slice(-3)}`;
}

// Signup endpoint
router.post('/signup', upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 },
    { name: 'paymentScreenshot', maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            firstName, lastName, district, sector, cell, village,
            idNumber, amount, username, password,
            referralId, referrerFirstName, referrerLastName
        } = req.body;

        const files = req.files;

        if (!files || !files.profilePhoto || !files.idFront || !files.idBack || !files.paymentScreenshot) {
            return res.status(400).json({ error: 'Missing files' });
        }

        const newUser = new User({
            firstName,
            lastName,
            district,
            sector,
            cell,
            village,
            idNumber,
            profilePhoto: files.profilePhoto[0].path,
            idFront: files.idFront[0].path,
            idBack: files.idBack[0].path,
            paymentScreenshot: files.paymentScreenshot[0].path,
            amount,
            username,
            password,
            referralId: referralId || generateReferralId(),
            referrerFirstName,
            referrerLastName
        });

        await newUser.save();

        res.status(201).json({ 
            message: 'User registered successfully', 
            referralId: newUser.referralId 
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
