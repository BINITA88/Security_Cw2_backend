// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({

//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   phoneNumber: {
//     type: String,
//   },
//   userName: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
//     role: {
//     type: String,
//     enum: ['user', 'admin'],
//     default: 'user',
//   },

//   isAdmin: {
//     type: Boolean,
//     default: false,
//   },
//   resetPasswordOTP: {
//     type: String,
//     default: null,
//   },
//   resetPasswordExpires: {
//     type: Date,
//     default: null,
//   },
//   profilePicture: {
//     type: String,
//   },
//   fromGoogle: {
//     type: Boolean,
//     default: false,
//   },
//   loginAttempts: {
//     type: Number,
//     default: 0,
//   },
//   otpAttempts: {
//     type: Number,
//     default: 0,
//   },
//   blockExpires: {
//     type: Date,
//     default: null,
//   },
//   otpBlockExpires: {
//     type: Date,
//     default: null,
//   },
//   isVerified: {
//     type: Boolean,
//     default: false,
//   },
//   googleOTP: {
//     type: String,
//     default: null,
//   },
//   googleOTPExpires: {
//     type: Date,
//     default: null,
//   },
// });

// const User = mongoose.model("users", userSchema);

// module.exports = User;






const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

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
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  passwordHistory: {
    type: [String],
    default: [],
  },
  passwordLastChanged: {
    type: Date,
    default: Date.now,
  },
  passwordExpiresAt: {
  type: Date,
  },

  isAdmin: {
    type: Boolean,
    default: false,
  },
  storedOTP: {
    type: String,
    default: null,
  },
  storedOTPExpires: {
    type: Date,
    default: null,
  },
  profilePicture: {
    type: String,
  },
  // fromGoogle: {
  //   type: Boolean,
  //   default: false,
  // },
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
  // googleOTP: {
  //   type: String,
  //   default: null,
  // },
  // googleOTPExpires: {
  //   type: Date,
  //   default: null,
  // },
});

const User = mongoose.model("users", userSchema);

module.exports = User;
