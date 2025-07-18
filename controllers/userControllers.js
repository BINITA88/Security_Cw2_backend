const { response } = require("express");
const ActivityLog = require("../models/activityLogModel");

const userModel = require("../models/userModel");
const { checkout } = require("../routes/userRoutes");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendOtp = require("../service/sentOtp");
const fs = require("fs");
const path = require("path");
const User = require("../models/userModel");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const axios = require("axios");
const { sendRegisterOtp } = require("../service/sendEmailOtp");
const speakeasy = require("speakeasy");
const nodemailer = require("nodemailer");
const MAX_LOGIN_ATTEMPTS = 3;
const BLOCK_DURATION = 15 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 3;

// ✅ Keep this at the top of your file
const JWT_SECRET = 'myhardcodedsecret'; // Use a long random string in real apps

// ✅ Then define your generateToken function
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: '24h',
  });
};

const refreshToken = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required",
    });
  }

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const newToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      token: newToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const createUser = async (req, res) => {
  const { firstName, lastName, userName, email, phoneNumber, password } =
    req.body;

  if (
    !firstName ||
    !lastName ||
    !userName ||
    !email ||
    !phoneNumber ||
    !password
  ) {
    return res.json({
      success: false,
      message: "Please enter all details!",
    });
  }
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  if (!passwordRegex.test(password)) {
    return res.json({
      success: false,
      message:
        "Password must contain at least 1 lowercase letter, 1 uppercase letter, 1 number, 1 special character, and be at least 6 characters long.",
    });
  }

  try {
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res.json({
        success: false,
        message: "User already exists!",
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log(`Generated OTP: ${otp}`); // Log the OTP

    // Save OTP in user model
    const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
    const newUser = new userModel({
      firstName,
      lastName,
      userName,
      email,
      phoneNumber,
      password, // Password will be hashed after OTP verification
      resetPasswordOTP: otp,
      resetPasswordExpires: otpExpires,
      isVerified: false,
    });

    await newUser.save();

    // Send OTP to user's email
    console.log(`Sending OTP to email: ${email}`); // Log email
    await sendRegisterOtp(email, otp);

    res.json({
      success: true,
      message: "User registered successfully! OTP sent to your email.",
    });
  } catch (error) {
    console.error("Error in createUser:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

const verifyRegistrationOtp = async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide email, OTP, and password.",
    });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "User is already verified!",
      });
    }

    // Check OTP validity
    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP!",
      });
    }

    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired!",
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user details and set as verified
    user.password = hashedPassword;
    user.isVerified = true;
    user.resetPasswordOTP = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User verified and registered successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

const googleLogin = async (req, res) => {
  console.log(req.body);

  // Destructuring the data
  const { token } = req.body;

  // Validate
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Please fill all the fields",
    });
  }

  // try catch
  try {
    // verify token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, given_name, family_name, picture } = ticket.getPayload();

    let user = await userModel.findOne({ email: email });

    if (!user) {
      const { password, role } = req.body;

      const randomSalt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, randomSalt);

      // Fetch the image from Google
      const response = await axios.get(picture, { responseType: "stream" });

      // Set up image name and path
      const imageName = `${given_name}_${family_name}_${Date.now()}.png`;
      const imagePath = path.join(
        __dirname,
        `../public/profile_pictures/${imageName}`
      );

      // Ensure the directory exists
      const directoryPath = path.dirname(imagePath);
      fs.mkdirSync(directoryPath, { recursive: true });

      // Create a write stream to save the image
      const writer = fs.createWriteStream(imagePath);
      response.data.pipe(writer);

      // Wait for the image to be fully saved
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      user = new userModel({
        firstName: given_name,
        lastName: family_name,
        email: email,
        userName: given_name,
        password: hashedPassword,
        isAdmin: role === "admin",
        profilePicture: imageName,
        fromGoogle: true,
      });
      await user.save();
    }

    // generate token
    const jwtToken = await jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      (options = {
        expiresIn:
          Date.now() + process.env.JWT_TOKEN_EXPIRE * 24 * 60 * 60 * 1000 ||
          "1d",
      })
    );

    return res.status(201).json({
      success: true,
      message: "User Logged In Successfully!",
      token: jwtToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error!",
      error: error,
    });
  }
};

const getUserByGoogleEmail = async (req, res) => {
  console.log(req.body);

  // Destructuring the data
  const { token } = req.body;

  // Validate
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Please fill all the fields",
    });
  }
  try {
    // verify token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    console.log(ticket);

    const { email } = ticket.getPayload();

    const user = await userModel.findOne({ email: email });

    if (user) {
      return res.status(200).json({
        success: true,
        message: "User found",
        data: user,
      });
    }

    res.status(201).json({
      success: true,
      message: "User not found",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: e,
    });
  }
};

// const loginUser = async (req, res) => {
//   const { email, password, captchaToken } = req.body;

//   // Ensure only the first value is used if duplicates are sent
//   const sanitizedEmail = Array.isArray(email) ? email[0] : email;
//   const sanitizedPassword = Array.isArray(password) ? password[0] : password;
//   const sanitizedCaptchaToken = Array.isArray(captchaToken)
//     ? captchaToken[0]
//     : captchaToken;

//   if (!sanitizedEmail || !sanitizedPassword || !sanitizedCaptchaToken) {
//     return res.status(400).json({
//       success: false,
//       message: "All fields are required, including CAPTCHA!",
//     });
//   }

//   try {
//     const user = await userModel.findOne({ email });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "User doesn't exist",
//       });
//     }
//     await ActivityLog.create({
//       user: user._id,
//       action: "login",
//       ipAddress: req.ip,
//       details: { email },
//     });

//     // Check if the user is blocked
//     if (user.blockExpires && user.blockExpires > Date.now()) {
//       return res.status(429).json({
//         success: false,
//         message: `Account is blocked. Try again after ${Math.ceil(
//           (user.blockExpires - Date.now()) / 60000
//         )} minutes.`,
//       });
//     }

//     // Verify password
//     const passwordCorrect = await bcrypt.compare(password, user.password);
//     if (!passwordCorrect) {
//       // Increment failed login attempts
//       user.loginAttempts += 1;

//       // Block the user if they exceed the maximum allowed attempts
//       if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
//         user.blockExpires = Date.now() + BLOCK_DURATION;
//         await user.save();

//         return res.status(429).json({
//           success: false,
//           message: `Too many failed attempts. Account is blocked for ${Math.ceil(
//             BLOCK_DURATION / 60000
//           )} minutes.`,
//         });
//       }

//       await user.save();
//       return res.status(400).json({
//         success: false,
//         message: "Password is incorrect",
//       });
//     }

//     // Reset login attempts on successful login
//     user.loginAttempts = 0;
//     user.blockExpires = null;
//     await user.save();

//     // Generate OTP for MFA
//     const otp = speakeasy.totp({
//       secret: process.env.OTP_SECRET + user._id,
//       encoding: "base32",
//     });

//     // Store OTP in database with expiration
//     user.googleOTP = otp;
//     user.googleOTPExpires = Date.now() + 5 * 60 * 1000; // OTP expires in 5 minutes
//     await user.save();

//     // Send OTP via email
//     const transporter = nodemailer.createTransport({
//       service: "Gmail",
//       auth: {
//         user: process.env.EMAIL_USERNAME,
//         pass: process.env.EMAIL_PASSWORD,
//       },
//     });

//     await transporter.sendMail({
//       from: process.env.EMAIL_USERNAME,
//       to: user.email,
//       subject: "Your One-Time Password (OTP)",
//       text: `Your OTP for login is: ${otp}`,
//     });
//     const token = generateToken(user._id);

//     res.status(200).json({
//       success: true,
//       message: "OTP sent to your email. Please verify to complete login.",
//       userId: user._id,
//       token,
//     });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server error",
//       error: err,
//     });
//   }
// };

const loginUser = async (req, res) => {
  const { email, password, captchaToken } = req.body;

  const sanitizedEmail = Array.isArray(email) ? email[0] : email;
  const sanitizedPassword = Array.isArray(password) ? password[0] : password;
  const sanitizedCaptchaToken = Array.isArray(captchaToken)
    ? captchaToken[0]
    : captchaToken;

  if (!sanitizedEmail || !sanitizedPassword || !sanitizedCaptchaToken) {
    return res.status(400).json({
      success: false,
      message: "All fields are required, including CAPTCHA!",
    });
  }

  try {
    const user = await userModel.findOne({ email: sanitizedEmail });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User doesn't exist",
      });
    }

    await ActivityLog.create({
      user: user._id,
      action: "login",
      ipAddress: req.ip,
      details: { email: sanitizedEmail },
    });

    if (user.blockExpires && user.blockExpires > Date.now()) {
      return res.status(429).json({
        success: false,
        message: `Account is blocked. Try again after ${Math.ceil(
          (user.blockExpires - Date.now()) / 60000
        )} minutes.`,
      });
    }

    const passwordCorrect = await bcrypt.compare(
      sanitizedPassword,
      user.password
    );
    if (!passwordCorrect) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.blockExpires = Date.now() + BLOCK_DURATION;
        await user.save();

        return res.status(429).json({
          success: false,
          message: `Too many failed attempts. Account is blocked for ${Math.ceil(
            BLOCK_DURATION / 60000
          )} minutes.`,
        });
      }

      await user.save();
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    user.loginAttempts = 0;
    user.blockExpires = null;
    await user.save();

    const otp = speakeasy.totp({
      secret: "your-otp-secret-key" + user._id, // Replace with your static or generated secret
      encoding: "base32",
    });

    user.googleOTP = otp;
    user.googleOTPExpires = Date.now() + 5 * 60 * 1000;
    await user.save();
    console.log(`Generated OTP: ${otp}`); // Log the OTP

    // Hardcoded Gmail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "binitaacharya2003@gmail.com",
        pass: "wkrf xgup pojh nrlc", // App password
      },
    });

    await transporter.sendMail({
      from: "binitaacharya2003@gmail.com",
      to: user.email,
      subject: "Your One-Time Password (OTP)",
      text: `Your OTP for login is: ${otp}`,
    });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email. Please verify to complete login.",
      userId: user._id,
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err,
    });
  }
};


const verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({
      success: false,
      message: "User ID and OTP are required!",
    });
  }

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      await ActivityLog.create({
        user: null,
        action: "otp_failed",
        ipAddress: req.ip,
        details: { userId, reason: "User not found" },
      });
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the user is blocked
    if (user.blockExpires && user.blockExpires > Date.now()) {
      return res.status(429).json({
        success: false,
        message: `Account is blocked. Try again after ${Math.ceil(
          (user.blockExpires - Date.now()) / 60000
        )} minutes.`,
      });
    }

    // Check if OTP exists and hasn't expired
    if (!user.googleOTP || !user.googleOTPExpires) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new one.",
      });
    }

    // Check if OTP has expired
    if (Date.now() > user.googleOTPExpires) {
      user.googleOTP = null;
      user.googleOTPExpires = null;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Verify OTP
    if (user.googleOTP !== otp) {
      // Increment failed OTP attempts
      user.otpAttempts = (user.otpAttempts || 0) + 1;

      // Block the user if they exceed the maximum allowed attempts
      if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
        user.blockExpires = Date.now() + BLOCK_DURATION;
        await user.save();

        return res.status(429).json({
          success: false,
          message: `Too many failed OTP attempts. Account is blocked for ${Math.ceil(
            BLOCK_DURATION / 60000
          )} minutes.`,
        });
      }

      await user.save();
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // Reset OTP attempts on successful verification
    user.otpAttempts = 0;
    user.blockExpires = null;
    user.googleOTP = null;
    user.googleOTPExpires = null;
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: userId }, JWT_SECRET);

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server error",
      error: err,
    });
  }
};

// get current user

const getCurrentUser = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    res.status(200).json({
      success: true,
      message: "User found!",
      user: user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// get token
const getMe = async (req, res) => {
  try {
    console.log(req.body);
    const { id } = req.body;

    const user = await userModel.findById(id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const token = await jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      JWT_SECRET
    );

    return res.status(200).json({
      success: true,
      message: "Token generated successfully!",
      token: token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

const forgotPassword = async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({
      success: false,
      message: "Please provide an phone.",
    });
  }

  try {
    const user = await userModel.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    if (user.otpBlockExpires && Date.now() < user.otpBlockExpires) {
      return res.status(403).json({
        success: false,
        message: `OTP requests are blocked. Try again after ${Math.ceil(
          (user.otpBlockExpires - Date.now()) / 60000
        )} minutes.`,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    await sendOtp(phoneNumber, otp);
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    user.otpBlockExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error!",
    });
  }
};

const verifyOtpAndResetPassword = async (req, res) => {
  const { phoneNumber, otp, password } = req.body;
  if (!phoneNumber || !otp || !password) {
    return res.status(400).json({
      success: false,
      message: "Please enter all fields",
    });
  }

  const key = `otp_attempts:${phoneNumber}`;

  // Check if user is blocked
  if (isUserBlocked(key)) {
    return res.status(429).json({
      success: false,
      message:
        "You are blocked for 15 minutes due to too many failed attempts.",
    });
  }

  try {
    const user = await userModel.findOne({ phoneNumber: phoneNumber });

    // Verify OTP
    if (user.resetPasswordOTP != otp) {
      // Increment failed attempts
      failedAttempts[key] = failedAttempts[key] || { count: 0 };
      failedAttempts[key].count += 1;

      // Block user if they exceed the limit
      if (failedAttempts[key].count >= 3) {
        blockUser(key);
        return res.status(429).json({
          success: false,
          message: "Too many failed attempts. You are blocked for 15 minutes.",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check if OTP is expired
    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // Hash the password
    const randomSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, randomSalt);

    // Update to database
    user.password = hashedPassword;
    await user.save();

    // Clear failed attempts
    delete failedAttempts[key];

    // Send response
    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
const uploadProfilePicture = async (req, res) => {
  // const id = req.user.id;
  console.log(req.files);
  const { profilePicture } = req.files;

  if (!profilePicture) {
    return res.status(400).json({
      success: false,
      message: "Please upload an image",
    });
  }

  //  Upload the image
  // 1. Generate new image name
  const imageName = `${Date.now()}-${profilePicture.name}`;

  // 2. Make a upload path (/path/upload - directory)
  const imageUploadPath = path.join(
    __dirname,
    `../public/profile_pictures/${imageName}`
  );

  // Ensure the directory exists
  const directoryPath = path.dirname(imageUploadPath);
  fs.mkdirSync(directoryPath, { recursive: true });

  try {
    // 3. Move the image to the upload path
    profilePicture.mv(imageUploadPath);

    //  send image name to the user
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      profilePicture: imageName,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

// edit user profile
const editUserProfile = async (req, res) => {
  const { firstName, lastName, userName, email, phoneNumber, profilePicture } =
    req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.userName = userName || user.userName;
    user.profilePicture = profilePicture || user.profilePicture;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user profile",
      error: error.message,
    });
  }
};
// Global object to track failed attempts
const failedAttempts = {};

// Function to block user for 15 minutes
const blockUser = (key) => {
  failedAttempts[key] = {
    count: 0,
    timestamp: Date.now() + 15 * 60 * 1000, // Block for 15 minutes
  };
};

// Function to check if user is blocked
const isUserBlocked = (key) => {
  if (failedAttempts[key] && failedAttempts[key].timestamp > Date.now()) {
    return true;
  }
  return false;
};

module.exports = {
  createUser,
  loginUser,
  verifyOTP,
  getMe,
  getCurrentUser,
  forgotPassword,
  verifyOtpAndResetPassword,
  uploadProfilePicture,
  editUserProfile,
  googleLogin,
  getUserByGoogleEmail,
  verifyRegistrationOtp,
  generateToken,
  refreshToken,
};
