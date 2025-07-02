// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    district: { type: String, required: true },
    sector: { type: String, required: true },
    cell: { type: String, required: true },
    village: { type: String, required: true },
    idNumber: { type: String, required: true },
    profilePhoto: { type: String, required: true },
    idFront: { type: String, required: true },
    idBack: { type: String, required: true },
    paymentScreenshot: { type: String, required: true },
    amount: { type: Number, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    referralId: { type: String, required: true, unique: true },
    referrerFirstName: { type: String },
    referrerLastName: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
