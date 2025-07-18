const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
  },
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  resetPasswordOTP: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  profilePicture: {
    type: String,
  },
  fromGoogle: {
    type: Boolean,
    default: false,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  otpAttempts: {
    type: Number,
    default: 0,
  },
  blockExpires: {
    type: Date,
    default: null,
  },
  otpBlockExpires: {
    type: Date,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  googleOTP: {
    type: String,
    default: null,
  },
  googleOTPExpires: {
    type: Date,
    default: null,
  },
});

const User = mongoose.model("users", userSchema);

module.exports = User;
