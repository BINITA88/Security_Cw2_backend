const router = require("express").Router();
const userController = require("../controllers/userControllers");
const {
  
  verifyRecaptcha,
  forgotPasswordLimiter,
  bookishProtectAuth,
} = require("../middleware/protect");
const rateLimit = require("express-rate-limit");
const {
  signupSchema,
  loginSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../models/signupSchema");
const { validateRequest } = require("../middleware/protect");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again after 10 minutes.",
});
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: "Too many OTP attempts. Please try again after 10 minutes.",
});


router.post(
  "/create",
  validateRequest(signupSchema),
  userController.createUser
);

// Creating user login route
router.post("/login", userController.bookishUserLogin);

router.post(
  "/verifyOTP",

  userController.verifyOTP
);

// current user

router.get("/current", userController.getCurrentUser);

// refresh token
router.post("/refresh-token", bookishProtectAuth, userController.refreshToken);

// get me
router.get("/getMe", bookishProtectAuth, userController.getMe);

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
router.put("/update", bookishProtectAuth, userController.editUserProfile);

// verify registration otp
router.post("/verify_registration_otp", userController.verifyRegistrationOtp);

//google
router.post("/googleLogin", userController.googleLogin);
router.post("/getUserByGoogle", userController.getUserByGoogleEmail);

module.exports = router;
