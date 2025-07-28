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


const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
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
// const createUser = async (req, res) => {
//   const { userName, email, phoneNumber, password } =
//     req.body;

//   if (

//     !userName ||
//     !email ||
//     !phoneNumber ||
//     !password
//   ) {
//     return res.json({
//       success: false,
//       message: "Please enter all details!",
//     });
//   }
//   const passwordRegex =
//     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
//   if (!passwordRegex.test(password)) {
//     return res.json({
//       success: false,
//       message:
//         "Your Password must contain at least 1 lowercase letter, 1 uppercase letter, 1 number, 1 special character, and be at least 6 characters long.",
//     });
//   }

//   try {
//     const existingUser = await userModel.findOne({ email });

//     if (existingUser) {
//       return res.json({
//         success: false,
//         message: "User already exists!",
//       });
//     }

//     // Generate OTP
//     const otp = Math.floor(100000 + Math.random() * 900000);
//     console.log(`Generated OTP: ${otp}`); // Log the OTP

//     // Save OTP in user model
//     const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
//     const newUser = new userModel({

//       userName,
//       email,
//       phoneNumber,
//       password, 
//       resetPasswordOTP: otp,
//       resetPasswordExpires: otpExpires,
//       isVerified: false,
//     });

//     await newUser.save();

//     // Send OTP to user's email
//     console.log(`Sending OTP to email: ${email}`); // Log email
//     await sendRegisterOtp(email, otp);

//     res.json({
//       success: true,
//       message: "User registered successfully! OTP sent to your email.",
//     });
//   } catch (error) {
//     console.error("Error in createUser:", error.message);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error!",
//     });
//   }
// };


const { encrypt } = require("../utils/encryption");

// // ✅ Register User (Plain Text)
// const createUser = async (req, res) => {
//   const { userName, email, phoneNumber, password } = req.body;

//   if (!userName || !email || !phoneNumber || !password) {
//     return res.status(400).json({ success: false, message: "Please enter all details!" });
//   }

//   const passwordRegex =
//     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

//   if (!passwordRegex.test(password)) {
//     return res.status(400).json({
//       success: false,
//       message: "Password must contain uppercase, lowercase, number, special character and be 6+ characters long",
//     });
//   }

//   try {
//     const normalizedEmail = email.toLowerCase();

//     const existingUser = await userModel.findOne({ email: normalizedEmail });
//     if (existingUser) {
//       return res.status(400).json({ success: false, message: "User already exists!" });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000);
//     const otpExpires = Date.now() + 10 * 60 * 1000;

//     console.log(`📩 OTP for ${normalizedEmail}: ${otp}`);

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = new userModel({
//       userName,
//       email: normalizedEmail,
//       phoneNumber,
//       password: hashedPassword,
//       storedOTP: otp,
//       storedOTPExpires: otpExpires,
//       isVerified: false,
//     });

//     await newUser.save();
//     await sendRegisterOtp(normalizedEmail, otp);

//     res.json({
//       success: true,
//       message: "User registered successfully! OTP sent to your email.",
//     });
//   } catch (error) {
//     console.error("createUser error:", error.message);
//     res.status(500).json({ success: false, message: "Internal server error!" });
//   }
// };



// ✅ Register User (Plain Text)
// const createUser = async (req, res) => {
//   const { userName, email, phoneNumber, password } = req.body;

//   if (!userName || !email || !phoneNumber || !password) {
//     return res.status(400).json({ success: false, message: "Please enter all details!" });
//   }

//   const passwordRegex =
//     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

//   if (!passwordRegex.test(password)) {
//     return res.status(400).json({
//       success: false,
//       message: "Password must contain uppercase, lowercase, number, special character and be 6+ characters long",
//     });
//   }

//   try {
//     const normalizedEmail = email.toLowerCase();

//     const existingUser = await userModel.findOne({ email: normalizedEmail });
//     if (existingUser) {
//       return res.status(400).json({ success: false, message: "User already exists!" });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000);
//     const otpExpires = Date.now() + 10 * 60 * 1000;

//     console.log(`📩 OTP for ${normalizedEmail}: ${otp}`);

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = new userModel({
//       userName,
//       email: normalizedEmail,
//       phoneNumber,
//       password: hashedPassword,
//       storedOTP: otp,
//       storedOTPExpires: otpExpires,
//       isVerified: false,
//     });

//     await newUser.save();
//     await sendRegisterOtp(normalizedEmail, otp);

//     // ✅ Log activity after user creation
//     try {
//       const ActivityLog = require("../models/activityLogModel"); // if not already imported
//       await ActivityLog.create({
//         user: newUser._id,
//         action: "register_success",
//         ipAddress: req.ip === "::1" ? "127.0.0.1" : req.ip,
//         timestamp: new Date(),
//         details: {
//           email: newUser.email,
//           userAgent: req.headers["user-agent"],
//         },
//       });
//     } catch (logErr) {
//       console.error("⚠️ Failed to log activity:", logErr.message);
//     }

//     res.json({
//       success: true,
//       message: "User registered successfully! OTP sent to your email.",
//     });
//   } catch (error) {
//     console.error("createUser error:", error.message);
//     res.status(500).json({ success: false, message: "Internal server error!" });
//   }
// };


// const createUser = async (req, res) => {
//   const { userName, email, phoneNumber, password } = req.body;

//   if (!userName || !email || !phoneNumber || !password) {
//     return res.status(400).json({ success: false, message: "Please enter all details!" });
//   }

//   const passwordRegex =
//     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

//   if (!passwordRegex.test(password)) {
//     return res.status(400).json({
//       success: false,
//       message:
//         "Password must contain uppercase, lowercase, number, special character and be 6+ characters long",
//     });
//   }

//   try {
//     const normalizedEmail = email.toLowerCase();
//     const existingUser = await userModel.findOne({ email: normalizedEmail });

//     if (existingUser) {
//       return res.status(400).json({ success: false, message: "User already exists!" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const recentPasswords = existingUser?.passwordHistory || [];
//     const isReused = await Promise.any(
//       recentPasswords.map((oldHash) => bcrypt.compare(password, oldHash))
//     ).catch(() => false);

//     if (isReused) {
//       return res.status(400).json({
//         success: false,
//         message: "This password was recently used. Please choose a different one.",
//       });
//     }

//     const updatedPasswordHistory = [hashedPassword];
//     if (recentPasswords.length > 0) {
//       updatedPasswordHistory.push(...recentPasswords.slice(0, 2));
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000);
//     const otpExpires = Date.now() + 10 * 60 * 1000;
//     console.log(`📩 OTP for ${normalizedEmail}: ${otp}`);

//     const newUser = new userModel({
//       userName,
//       email: normalizedEmail,
//       phoneNumber,
//       password: hashedPassword,
//       storedOTP: otp,
//       storedOTPExpires: otpExpires,
//       isVerified: false,
//       passwordHistory: updatedPasswordHistory,
//       passwordLastChanged: new Date(),
//     });

//     await newUser.save();
//     await sendRegisterOtp(normalizedEmail, otp);

//     // ✅ Log activity
//     try {
//       const ActivityLog = require("../models/activityLogModel");
//       await ActivityLog.create({
//         user: newUser._id,
//         action: "register_success",
//         ipAddress: req.ip === "::1" ? "127.0.0.1" : req.ip,
//         timestamp: new Date(),
//         details: {
//           email: newUser.email,
//           userAgent: req.headers["user-agent"],
//         },
//       });
//     } catch (logErr) {
//       console.error("⚠️ Failed to log activity:", logErr.message);
//     }

//     res.json({
//       success: true,
//       message: "User registered successfully! OTP sent to your email.",
//     });
//   } catch (error) {
//     console.error("createUser error:", error.message);
//     res.status(500).json({ success: false, message: "Internal server error!" });
//   }
// };


const createUser = async (req, res) => {
  const { userName, email, phoneNumber, password } = req.body;

  if (!userName || !email || !phoneNumber || !password) {
    return res.status(400).json({ success: false, message: "Please enter all details!" });
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must contain uppercase, lowercase, number, special character and be 6+ characters long",
    });
  }

  try {
    const normalizedEmail = email.toLowerCase();
    const existingUser = await userModel.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const recentPasswords = existingUser?.passwordHistory || [];
    const isReused = await Promise.any(
      recentPasswords.map((oldHash) => bcrypt.compare(password, oldHash))
    ).catch(() => false);

    if (isReused) {
      return res.status(400).json({
        success: false,
        message: "This password was recently used. Please choose a different one.",
      });
    }
   const passwordExpiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
    const updatedPasswordHistory = [hashedPassword];
    if (recentPasswords.length > 0) {
      updatedPasswordHistory.push(...recentPasswords.slice(0, 2));
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = Date.now() + 10 * 60 * 1000;
    console.log(`📩 OTP for ${normalizedEmail}: ${otp}`);

 

    const newUser = new userModel({
      userName,
      email: normalizedEmail,
      phoneNumber,
      password: hashedPassword,
      storedOTP: otp,
      storedOTPExpires: otpExpires,
      isVerified: false,
      passwordHistory: updatedPasswordHistory,
      passwordLastChanged: new Date(),
      passwordExpiresAt: passwordExpiryDate, 
    });

    await newUser.save();
    await sendRegisterOtp(normalizedEmail, otp);

    // ✅ Log activity
    try {
      const ActivityLog = require("../models/activityLogModel");
      await ActivityLog.create({
        user: newUser._id,
        action: "register_success",
        ipAddress: req.ip === "::1" ? "127.0.0.1" : req.ip,
        timestamp: new Date(),
        details: {
          email: newUser.email,
          userAgent: req.headers["user-agent"],
        },
      });
    } catch (logErr) {
      console.error("⚠️ Failed to log activity:", logErr.message);
    }

    res.json({
      success: true,
      message: "User registered successfully! OTP sent to your email.",
    });
  } catch (error) {
    console.error("createUser error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error!" });
  }
};


// ✅ Verify OTP and Encrypt Fields
const verifyRegistrationOtp = async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide email, OTP, and password.",
    });
  }

  try {
    const normalizedEmail = email.toLowerCase();
    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "User already verified!" });
    }

    if (parseInt(user.storedOTP) !== parseInt(otp)) {
      return res.status(400).json({ success: false, message: "Invalid OTP!" });
    }

    if (user.storedOTPExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP expired!" });
    }

    // Update and encrypt after verification
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.isVerified = true;
    user.storedOTP = null;
    user.storedOTPExpires = null;

    // Encrypt only now
    user.email = encrypt(normalizedEmail);
    user.phoneNumber = encrypt(user.phoneNumber);

    await user.save();

    res.status(200).json({
      success: true,
      message: "User verified and sensitive data encrypted!",
    });
  } catch (error) {
    console.error("verifyRegistrationOtp error:", error.message);
    res.status(500).json({ success: false, message: "Internal server error!" });
  }
};


// const verifyRegistrationOtp = async (req, res) => {
//   const { email, otp, password } = req.body;

//   if (!email || !otp || !password) {
//     return res.status(400).json({
//       success: false,
//       message: "Please provide email, OTP, and password.",
//     });
//   }

//   try {
//     const user = await userModel.findOne({ email });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found!",
//       });
//     }

//     if (user.isVerified) {
//       return res.status(400).json({
//         success: false,
//         message: "User is already verified!",
//       });
//     }

//     // Check OTP validity
//     if (user.resetPasswordOTP !== otp) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid OTP!",
//       });
//     }

//     if (user.resetPasswordExpires < Date.now()) {
//       return res.status(400).json({
//         success: false,
//         message: "OTP has expired!",
//       });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);
//     user.password = hashedPassword;


//     user.isVerified = true;
//     user.resetPasswordOTP = null;
//     user.resetPasswordExpires = null;
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "User verified and registered successfully!",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error!",
//     });
//   }
// };

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
          "30d",
      })
    );

    return res.status(201).json({
      success: true,
      message: "User Logged In Successfully!",
      token: jwtToken,
      user: {
        id: user._id,
   
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

// const bookishUserLogin = async (req, res) => {
//   const { email, password, captchaToken } = req.body;

//   const inputEmail = Array.isArray(email) ? email[0] : email;
//   const inputPassword = Array.isArray(password) ? password[0] : password;
//   const inputCaptcha = Array.isArray(captchaToken) ? captchaToken[0] : captchaToken;

//   if (!inputEmail || !inputPassword || !inputCaptcha) {
//     return res.status(400).json({
//       success: false,
//       message: "Email, password, and CAPTCHA are required!",
//     });
//   }

//   try {
//     const foundUser = await userModel.findOne({ email: inputEmail });

//     if (!foundUser) {
//       return res.status(400).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     await ActivityLog.create({
//       user: foundUser._id,
//       action: "login_attempt",
//       ipAddress: req.ip,
//       details: { email: inputEmail },
//     });

//     if (foundUser.blockExpires && foundUser.blockExpires > Date.now()) {
//       const remaining = Math.ceil((foundUser.blockExpires - Date.now()) / 60000);
//       return res.status(429).json({
//         success: false,
//         message: `Account is temporarily blocked. Try again in ${remaining} minutes.`,
//       });
//     }

//     const isPasswordValid = await bcrypt.compare(inputPassword, foundUser.password);
//     if (!isPasswordValid) {
//       foundUser.loginAttempts += 1;

//       if (foundUser.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
//         foundUser.blockExpires = Date.now() + BLOCK_DURATION;
//         await foundUser.save();

//         return res.status(429).json({
//           success: false,
//           message: `Too many failed attempts. Account locked for ${Math.ceil(BLOCK_DURATION / 60000)} minutes.`,
//         });
//       }

//       await foundUser.save();
//       return res.status(400).json({
//         success: false,
//         message: "Incorrect password",
//       });
//     }

//     foundUser.loginAttempts = 0;
//     foundUser.blockExpires = null;
//     await foundUser.save();

//     const generatedOTP = speakeasy.totp({
//       secret: "your-otp-secret-key" + foundUser._id,
//       encoding: "base32",
//     });

//     foundUser.googleOTP = generatedOTP;
//     foundUser.googleOTPExpires = Date.now() + 5 * 60 * 1000;
//     await foundUser.save();

//     console.log(`Generated OTP: ${generatedOTP}`);

//     const emailTransport = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: "binitaacharya2003@gmail.com",
//         pass: "wkrf xgup pojh nrlc",
//       },
//     });

//     await emailTransport.sendMail({
//       from: "binitaacharya2003@gmail.com",
//       to: foundUser.email,
//       subject: "Bookish Login OTP",
//       text: `Your OTP code is: ${generatedOTP}`,
//     });

//     const jwtToken = generateToken(foundUser._id);

//     res.status(200).json({
//       success: true,
//       message: "OTP sent to your email. Please check your inbox.",
//       userId: foundUser._id,
//       token: jwtToken,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong. Please try again later.",
//       error,
//     });
//   }
// };


// const bookishUserLogin = async (req, res) => {
//   const { email, password, captchaToken } = req.body;

//   const inputEmail = Array.isArray(email) ? email[0] : email;
//   const inputPassword = Array.isArray(password) ? password[0] : password;
//   const inputCaptcha = Array.isArray(captchaToken) ? captchaToken[0] : captchaToken;

//   if (!inputEmail || !inputPassword || !inputCaptcha) {
//     return res.status(400).json({
//       success: false,
//       message: "Email, password, and CAPTCHA are required!",
//     });
//   }

//   try {
//     const foundUser = await userModel.findOne({ email: inputEmail });

//     if (!foundUser) {
//       return res.status(400).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     await ActivityLog.create({
//       user: foundUser._id,
//       action: "login_attempt",
//       ipAddress: req.ip,
//       details: { email: inputEmail },
//     });

//     if (foundUser.blockExpires && foundUser.blockExpires > Date.now()) {
//       const remaining = Math.ceil((foundUser.blockExpires - Date.now()) / 60000);
//       return res.status(429).json({
//         success: false,
//         message: `Account is temporarily blocked. Try again in ${remaining} minutes.`,
//       });
//     }

//     const isPasswordValid = await bcrypt.compare(inputPassword, foundUser.password);
//     if (!isPasswordValid) {
//       foundUser.loginAttempts += 1;

//       if (foundUser.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
//         foundUser.blockExpires = Date.now() + BLOCK_DURATION;
//         await foundUser.save();

//         return res.status(429).json({
//           success: false,
//           message: `Too many failed attempts. Account locked for ${Math.ceil(BLOCK_DURATION / 60000)} minutes.`,
//         });
//       }

//       await foundUser.save();
//       return res.status(400).json({
//         success: false,
//         message: "Incorrect password",
//       });
//     }

//     foundUser.loginAttempts = 0;
//     foundUser.blockExpires = null;
//     await foundUser.save();

//     const generatedOTP = speakeasy.totp({
//       secret: "your-otp-secret-key" + foundUser._id,
//       encoding: "base32",
//     });

//     foundUser.googleOTP = generatedOTP;
//     foundUser.googleOTPExpires = Date.now() + 5 * 60 * 1000;
//     await foundUser.save();

//     console.log(`Generated OTP: ${generatedOTP}`);

//     const emailTransport = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: "binitaacharya2003@gmail.com",
//         pass: "wkrf xgup pojh nrlc",
//       },
//     });

//     await emailTransport.sendMail({
//       from: "binitaacharya2003@gmail.com",
//       to: foundUser.email,
//       subject: "Bookish Login OTP",
//       text: `Your OTP code is: ${generatedOTP}`,
//     });

//     const jwtToken = generateToken(foundUser._id);


//     res.cookie("Bookish_token", jwtToken, {
//       httpOnly: true,
//       secure: true, 
//       sameSite: "Strict",
//       maxAge: 30 * 24 * 60 * 60 * 1000, 
//     });

//     return res.status(200).json({
//       success: true,
//       message: "OTP sent to your email. Please check your inbox.",
//       userId: foundUser._id,
//       // ✅ token removed from response body (now in cookie)
//     });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong. Please try again later.",
//       error,
//     });
//   }
// };



const { decrypt } = require("../utils/encryption"); // ✅ import decryption

// const bookishUserLogin = async (req, res) => {
//   const { email, password, captchaToken } = req.body;

//   const inputEmail = Array.isArray(email) ? email[0] : email;
//   const inputPassword = Array.isArray(password) ? password[0] : password;
//   const inputCaptcha = Array.isArray(captchaToken) ? captchaToken[0] : captchaToken;

//   if (!inputEmail || !inputPassword || !inputCaptcha) {
//     return res.status(400).json({
//       success: false,
//       message: "Email, password, and CAPTCHA are required!",
//     });
//   }

//   try {
//     const allUsers = await userModel.find();

//     // ✅ Decrypt each user’s email to find the match
//     const foundUser = allUsers.find((u) => {
//       const decryptedEmail = decrypt(u.email);
//       return decryptedEmail && decryptedEmail.toLowerCase() === inputEmail.toLowerCase();
//     });

//     if (!foundUser) {
//       return res.status(400).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     if (foundUser.blockExpires && foundUser.blockExpires > Date.now()) {
//       const remaining = Math.ceil((foundUser.blockExpires - Date.now()) / 60000);
//       return res.status(429).json({
//         success: false,
//         message: `Account is temporarily blocked. Try again in ${remaining} minutes.`,
//       });
//     }

//     const isPasswordValid = await bcrypt.compare(inputPassword, foundUser.password);
//     if (!isPasswordValid) {
//       foundUser.loginAttempts += 1;

//       if (foundUser.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
//         foundUser.blockExpires = Date.now() + BLOCK_DURATION;
//         await foundUser.save();
//         return res.status(429).json({
//           success: false,
//           message: `Too many failed attempts. Account locked for ${Math.ceil(BLOCK_DURATION / 60000)} minutes.`,
//         });
//       }

//       await foundUser.save();
//       return res.status(400).json({
//         success: false,
//         message: "Incorrect password",
//       });
//     }

//     foundUser.loginAttempts = 0;
//     foundUser.blockExpires = null;
//     await foundUser.save();

//     // ✅ OTP generation
//     const generatedOTP = speakeasy.totp({
//       secret: "your-otp-secret-key" + foundUser._id,
//       encoding: "base32",
//     });

//     foundUser.googleOTP = generatedOTP;
//     foundUser.googleOTPExpires = Date.now() + 5 * 60 * 1000;
//     await foundUser.save();

//     console.log(`🔐 Login OTP for ${inputEmail}: ${generatedOTP}`);

//     const emailTransport = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: "binitaacharya2003@gmail.com",
//         pass: "wkrf xgup pojh nrlc",
//       },
//     });

//     await emailTransport.sendMail({
//       from: "binitaacharya2003@gmail.com",
//       to: inputEmail,
//       subject: "Bookish Login OTP",
//       text: `Your OTP code is: ${generatedOTP}`,
//     });

//     const jwtToken = generateToken(foundUser._id);

//     res.cookie("Bookish_token", jwtToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "Strict",
//       maxAge: 30 * 24 * 60 * 60 * 1000,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "OTP sent to your email. Please check your inbox.",
//       userId: foundUser._id,
//     });

//   } catch (error) {
//     console.error("Login Error:", error.message);
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong. Please try again later.",
//     });
//   }
// };





// const bookishUserLogin = async (req, res) => {
//   const { email, password, captchaToken } = req.body;

//   const inputEmail = Array.isArray(email) ? email[0] : email;
//   const inputPassword = Array.isArray(password) ? password[0] : password;
//   const inputCaptcha = Array.isArray(captchaToken) ? captchaToken[0] : captchaToken;

//   if (!inputEmail || !inputPassword || !inputCaptcha) {
//     return res.status(400).json({ success: false, message: "Email, password, and CAPTCHA are required!" });
//   }

//   try {
//     const allUsers = await userModel.find();
//     let foundUser = null;

//     for (const user of allUsers) {
//       const decryptedEmail = decrypt(user.email);
//       if (decryptedEmail && decryptedEmail.toLowerCase() === inputEmail.toLowerCase()) {
//         foundUser = user;
//         break;
//       }
//     }

//     if (!foundUser) {
//       return res.status(400).json({ success: false, message: "User not found" });
//     }

//     if (foundUser.blockExpires && foundUser.blockExpires > Date.now()) {
//       return res.status(429).json({
//         success: false,
//         message: `Account is temporarily blocked. Try again in ${Math.ceil((foundUser.blockExpires - Date.now()) / 60000)} minutes.`,
//       });
//     }

//     const isPasswordValid = await bcrypt.compare(inputPassword, foundUser.password);
//     if (!isPasswordValid) {
//       foundUser.loginAttempts += 1;

//       if (foundUser.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
//         foundUser.blockExpires = Date.now() + BLOCK_DURATION;
//         await foundUser.save();

//         return res.status(429).json({
//           success: false,
//           message: `Too many failed attempts. Account locked for ${Math.ceil(BLOCK_DURATION / 60000)} minutes.`,
//         });
//       }

//       await foundUser.save();
//       return res.status(400).json({ success: false, message: "Incorrect password" });
//     }

//     foundUser.loginAttempts = 0;
//     foundUser.blockExpires = null;

//     // ✅ Generate and save OTP using correct fields
//     const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
//     foundUser.otp = generatedOTP;
//     foundUser.otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
//     await foundUser.save();

//     console.log(`📩 OTP sent to ${inputEmail}: ${generatedOTP}`);
//     await sendRegisterOtp(inputEmail, generatedOTP);

//     return res.status(200).json({
//       success: true,
//       message: "OTP sent to your email.",
//       userId: foundUser._id,
//     });
//   } catch (err) {
//     console.error("Login error:", err.message);
//     return res.status(500).json({ success: false, message: "Something went wrong." });
//   }
// };

// const bookishUserLogin = async (req, res) => {
//   const { email, password, captchaToken } = req.body;

//   const inputEmail = Array.isArray(email) ? email[0] : email;
//   const inputPassword = Array.isArray(password) ? password[0] : password;
//   const inputCaptcha = Array.isArray(captchaToken) ? captchaToken[0] : captchaToken;

//   if (!inputEmail || !inputPassword || !inputCaptcha) {
//     return res.status(400).json({ success: false, message: "Email, password, and CAPTCHA are required!" });
//   }

//   try {
//     const allUsers = await userModel.find();
//     let foundUser = null;

//     for (const user of allUsers) {
//       const decryptedEmail = decrypt(user.email);
//       if (decryptedEmail && decryptedEmail.toLowerCase() === inputEmail.toLowerCase()) {
//         foundUser = user;
//         break;
//       }
//     }

//     if (!foundUser) {
//       return res.status(400).json({ success: false, message: "User not found" });
//     }

//     if (foundUser.blockExpires && foundUser.blockExpires > Date.now()) {
//       return res.status(429).json({
//         success: false,
//         message: `Account is temporarily blocked. Try again in ${Math.ceil((foundUser.blockExpires - Date.now()) / 60000)} minutes.`,
//       });
//     }

//     const isPasswordValid = await bcrypt.compare(inputPassword, foundUser.password);
//     if (!isPasswordValid) {
//       foundUser.loginAttempts += 1;

//       if (foundUser.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
//         foundUser.blockExpires = Date.now() + BLOCK_DURATION;
//         await foundUser.save();

//         return res.status(429).json({
//           success: false,
//           message: `Too many failed attempts. Account locked for ${Math.ceil(BLOCK_DURATION / 60000)} minutes.`,
//         });
//       }

//       await foundUser.save();
//       return res.status(400).json({ success: false, message: "Incorrect password" });
//     }

//     foundUser.loginAttempts = 0;
//     foundUser.blockExpires = null;

//     // ✅ Generate and save OTP
//     const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
//     foundUser.otp = generatedOTP;
//     foundUser.otpExpires = Date.now() + 5 * 60 * 1000;
//     await foundUser.save();

//     console.log(`📩 OTP sent to ${inputEmail}: ${generatedOTP}`);
//     await sendRegisterOtp(inputEmail, generatedOTP);


//     try {
//       await ActivityLog.create({
//         user: foundUser._id,
//         action: "login_success",
//         ipAddress: req.ip === "::1" ? "127.0.0.1" : req.ip,
//         timestamp: new Date(),
//         details: {
//           email: inputEmail,
//           userAgent: req.headers["user-agent"],
//         },
//       });
//     } catch (logError) {
//       console.error("⚠️ Failed to log login activity:", logError.message);
//     }

//     return res.status(200).json({
//       success: true,
//       message: "OTP sent to your email.",
//       userId: foundUser._id,
//     });
//   } catch (err) {
//     console.error("Login error:", err.message);
//     return res.status(500).json({ success: false, message: "Something went wrong." });
//   }
// };

const { logActivity } = require("../service/logService"); // ✅ Import

// const bookishUserLogin = async (req, res) => {
//   const { email, password, captchaToken } = req.body;

//   const inputEmail = Array.isArray(email) ? email[0] : email;
//   const inputPassword = Array.isArray(password) ? password[0] : password;
//   const inputCaptcha = Array.isArray(captchaToken) ? captchaToken[0] : captchaToken;

//   if (!inputEmail || !inputPassword || !inputCaptcha) {
//     return res.status(400).json({ success: false, message: "Email, password, and CAPTCHA are required!" });
//   }

//   try {
//     const allUsers = await userModel.find();
//     let foundUser = null;

//     for (const user of allUsers) {
//       const decryptedEmail = decrypt(user.email);
//       if (decryptedEmail && decryptedEmail.toLowerCase() === inputEmail.toLowerCase()) {
//         foundUser = user;
//         break;
//       }
//     }

//     if (!foundUser) {
//       await logActivity(req, null, "USER_LOGIN_FAIL", "FATAL", {
//         email: inputEmail,
//         reason: "User not found",
//       });
//       return res.status(400).json({ success: false, message: "User not found" });
//     }

//     if (foundUser.blockExpires && foundUser.blockExpires > Date.now()) {
//       await logActivity(req, foundUser._id, "ACCOUNT_LOCKED", "FATAL", {
//         reason: "Account locked",
//         blockExpires: foundUser.blockExpires,
//       });

//       return res.status(429).json({
//         success: false,
//         message: `Account is temporarily blocked. Try again in ${Math.ceil((foundUser.blockExpires - Date.now()) / 60000)} minutes.`,
//       });
//     }

//     const isPasswordValid = await bcrypt.compare(inputPassword, foundUser.password);
//     if (!isPasswordValid) {
//       foundUser.loginAttempts += 1;

//       const severity = foundUser.loginAttempts >= MAX_LOGIN_ATTEMPTS ? "FATAL" : "WARN";
//       const reason = foundUser.loginAttempts >= MAX_LOGIN_ATTEMPTS
//         ? "Too many failed login attempts. Account locked."
//         : "Incorrect password";

//       if (foundUser.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
//         foundUser.blockExpires = Date.now() + BLOCK_DURATION;
//       }

//       await foundUser.save();

//       await logActivity(req, foundUser._id, "USER_LOGIN_FAIL", severity, {
//         reason,
//         attempts: foundUser.loginAttempts,
//       });

//       return res.status(severity === "FATAL" ? 429 : 400).json({
//         success: false,
//         message: reason,
//       });
//     }

//     foundUser.loginAttempts = 0;
//     foundUser.blockExpires = null;

//     const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
//     foundUser.otp = generatedOTP;
//     foundUser.otpExpires = Date.now() + 5 * 60 * 1000;
//     await foundUser.save();

//     await sendRegisterOtp(inputEmail, generatedOTP);

//     await logActivity(req, foundUser._id, "LOGIN_SUCCESS", "INFO", {
//       email: inputEmail,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "OTP sent to your email.",
//       userId: foundUser._id,
//     });
//   } catch (err) {
//     console.error("Login error:", err.message);
//     return res.status(500).json({ success: false, message: "Something went wrong." });
//   }
// };



const bookishUserLogin = async (req, res) => {
  const { email, password, captchaToken } = req.body;

  const inputEmail = Array.isArray(email) ? email[0] : email;
  const inputPassword = Array.isArray(password) ? password[0] : password;
  const inputCaptcha = Array.isArray(captchaToken) ? captchaToken[0] : captchaToken;

  if (!inputEmail || !inputPassword || !inputCaptcha) {
    return res.status(400).json({
      success: false,
      message: "Email, password, and CAPTCHA are required!",
    });
  }

  try {
    const allUsers = await userModel.find();
    let foundUser = null;

    for (const user of allUsers) {
      const decryptedEmail = decrypt(user.email);
      if (decryptedEmail && decryptedEmail.toLowerCase() === inputEmail.toLowerCase()) {
        foundUser = user;
        break;
      }
    }

    if (!foundUser) {
      await logActivity(req, null, "USER_LOGIN_FAIL", "FATAL", {
        email: inputEmail,
        reason: "User not found",
      });
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (foundUser.blockExpires && foundUser.blockExpires > Date.now()) {
      await logActivity(req, foundUser._id, "ACCOUNT_LOCKED", "FATAL", {
        reason: "Account locked",
        blockExpires: foundUser.blockExpires,
      });

      return res.status(429).json({
        success: false,
        message: `Account is temporarily blocked. Try again in ${Math.ceil(
          (foundUser.blockExpires - Date.now()) / 60000
        )} minutes.`,
      });
    }

const isPasswordValid = await bcrypt.compare(inputPassword, foundUser.password);
if (!isPasswordValid) {
  foundUser.loginAttempts += 1;

  let reason = "Incorrect password";
  let responseStatus = 400;

  if (foundUser.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    foundUser.blockExpires = Date.now() + BLOCK_DURATION;
    reason = "Too many failed login attempts. Account locked.";
    responseStatus = 429;
  }

  await foundUser.save();

  const severity = responseStatus === 429 ? "FATAL" : "WARN";

  await logActivity(req, foundUser._id, "USER_LOGIN_FAIL", severity, {
    reason,
    attempts: foundUser.loginAttempts,
  });

  return res.status(responseStatus).json({
    success: false,
    message: reason,
  });
}


    // ✅ Password is valid — Check for expiry
    if (foundUser.passwordExpiresAt && foundUser.passwordExpiresAt < new Date()) {
      await logActivity(req, foundUser._id, "PASSWORD_EXPIRED", "WARN", {
        email: inputEmail,
        expiredAt: foundUser.passwordExpiresAt,
      });

      return res.status(403).json({
        success: false,
        message: "Your password has expired. Please update your password.",
      });
    }

    // ✅ Password valid and not expired — proceed with OTP
    foundUser.loginAttempts = 0;
    foundUser.blockExpires = null;

    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    foundUser.otp = generatedOTP;
    foundUser.otpExpires = Date.now() + 5 * 60 * 1000;

    await foundUser.save();
    await sendRegisterOtp(inputEmail, generatedOTP);

    await logActivity(req, foundUser._id, "LOGIN_SUCCESS", "INFO", {
      email: inputEmail,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email.",
      userId: foundUser._id,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};


// const verifyOTP = async (req, res) => {
//   const { email, otp } = req.body;

//   if (!email || !otp) {
//     return res.status(400).json({
//       success: false,
//       message: "Email and OTP are required!",
//     });
//   }

//   try {
//     const allUsers = await userModel.find();
//     let foundUser = null;

//     for (const user of allUsers) {
//       try {
//         const decryptedEmail = decrypt(user.email);
//         if (decryptedEmail && decryptedEmail.toLowerCase() === email.toLowerCase()) {
//           foundUser = user;
//           break;
//         }
//       } catch (err) {
//         // skip invalid encryption values
//       }
//     }

//     if (!foundUser) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     if (foundUser.blockExpires && foundUser.blockExpires > Date.now()) {
//       return res.status(429).json({
//         success: false,
//         message: `Account is blocked. Try again after ${Math.ceil((foundUser.blockExpires - Date.now()) / 60000)} minutes.`,
//       });
//     }

//     if (!foundUser.googleOTP || !foundUser.googleOTPExpires) {
//       return res.status(400).json({
//         success: false,
//         message: "No OTP found. Please request a new one.",
//       });
//     }

//     if (Date.now() > foundUser.googleOTPExpires) {
//       foundUser.googleOTP = null;
//       foundUser.googleOTPExpires = null;
//       await foundUser.save();
//       return res.status(400).json({
//         success: false,
//         message: "OTP has expired. Please request a new one.",
//       });
//     }

//     if (String(foundUser.googleOTP) !== String(otp)) {
//       foundUser.otpAttempts = (foundUser.otpAttempts || 0) + 1;
//       if (foundUser.otpAttempts >= MAX_OTP_ATTEMPTS) {
//         foundUser.blockExpires = Date.now() + BLOCK_DURATION;
//         await foundUser.save();
//         return res.status(429).json({
//           success: false,
//           message: `Too many failed OTP attempts. Account blocked for ${Math.ceil(BLOCK_DURATION / 60000)} minutes.`,
//         });
//       }

//       await foundUser.save();
//       return res.status(400).json({
//         success: false,
//         message: "Invalid OTP. Please try again.",
//       });
//     }

//     // ✅ OTP matched
//     foundUser.otpAttempts = 0;
//     foundUser.blockExpires = null;
//     foundUser.googleOTP = null;
//     foundUser.googleOTPExpires = null;
//     await foundUser.save();

//     const decryptedEmail = decrypt(foundUser.email);
//     const decryptedPhone = decrypt(foundUser.phoneNumber);

//     const token = jwt.sign({ id: foundUser._id }, process.env.JWT_SECRET, {
//       expiresIn: "30d",
//     });

//     return res.status(200).json({
//       success: true,
//       message: "OTP Verified and Login successful!",
//       token,
//       user: {
//         _id: foundUser._id,
//         userName: foundUser.userName,
//         email: decryptedEmail,
//         phoneNumber: decryptedPhone,
//       },
//     });
//   } catch (err) {
//     console.error("verifyOTP error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };





const verifyOTP = async (req, res) => {
  const { userId, otp } = req.body;

  const bypassOtp = true; // ✅ Set this to false in production!

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

    // Check block
    if (user.blockExpires && user.blockExpires > Date.now()) {
      return res.status(429).json({
        success: false,
        message: `Account is blocked. Try again after ${Math.ceil(
          (user.blockExpires - Date.now()) / 60000
        )} minutes.`,
      });
    }

    // ✅ Allow even if OTP is expired or wrong
    let otpSuccess = false;

    if (user.otp && user.otpExpires && Date.now() <= user.otpExpires && user.otp === otp) {
      otpSuccess = true;
    }

    if (!otpSuccess) {
      if (!bypassOtp) {
        user.otpAttempts = (user.otpAttempts || 0) + 1;

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
          message: "Invalid or expired OTP. Please try again.",
        });
      }
    }

    // ✅ Proceed anyway
    user.otpAttempts = 0;
    user.blockExpires = null;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign({ id: userId }, JWT_SECRET);

    return res.status(200).json({
      success: true,
      message: otpSuccess ? "Login successful with OTP" : "Login bypassed OTP check",
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
    user.storedOTP = otp;
    user.storedOTPExpires = Date.now() + 10 * 60 * 1000;
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
    if (user.storedOTP != otp) {
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
  const { profilePicture } = req.files;

  if (!profilePicture) {
    return res.status(400).json({
      success: false,
      message: "Please upload an image",
    });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowedTypes.includes(profilePicture.mimetype)) {
    return res.status(400).json({
      success: false,
      message: "Only JPG, JPEG, and PNG files are allowed",
    });
  }

  // Generate new image name
  const imageName = `${Date.now()}-${profilePicture.name}`;

  // Upload path
  const imageUploadPath = path.join(
    __dirname,
    `../public/profile_pictures/${imageName}`
  );

  // Ensure directory exists
  const directoryPath = path.dirname(imageUploadPath);
  fs.mkdirSync(directoryPath, { recursive: true });

  try {
    // Move the image
    await profilePicture.mv(imageUploadPath);

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
      error: error.message,
    });
  }
};


// edit user profile
const editUserProfile = async (req, res) => {
  const {  userName, email, phoneNumber, profilePicture } =
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
bookishUserLogin,  verifyOTP,
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

