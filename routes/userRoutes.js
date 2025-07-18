const router = require("express").Router();
const userController = require("../controllers/userControllers");
const {
  authGuard,
  verifyRecaptcha,
  forgotPasswordLimiter,
} = require("../middleware/authGuard");
const rateLimit = require("express-rate-limit");
const {
  signupSchema,
  loginSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../models/signupSchema");
const { validateRequest } = require("../middleware/authGuard");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again after 15 minutes.",
});
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Too many OTP attempts. Please try again after 15 minutes.",
});

// Creating user registration route
router.post(
  "/create",
  validateRequest(signupSchema),
  userController.createUser
);

// Creating user login route
router.post("/login", userController.loginUser);

router.post(
  "/verifyOTP",

  userController.verifyOTP
);

// current user

router.get("/current", userController.getCurrentUser);

// refresh token
router.post("/refresh-token", authGuard, userController.refreshToken);

// get me
router.get("/getMe", authGuard, userController.getMe);

router.post(
  "/forgot_password",
  forgotPasswordLimiter,

  userController.forgotPassword
);

// verify otp and reset password
router.post(
  "/verify_otp",

  userController.verifyOtpAndResetPassword
);

// upload profile picture
router.post("/profile_picture", userController.uploadProfilePicture);

// update user details
router.put("/update", authGuard, userController.editUserProfile);

// verify registration otp
router.post("/verify_registration_otp", userController.verifyRegistrationOtp);

//google
router.post("/googleLogin", userController.googleLogin);
router.post("/getUserByGoogle", userController.getUserByGoogleEmail);

module.exports = router;
