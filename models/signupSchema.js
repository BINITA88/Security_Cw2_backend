const Joi = require("joi");

// Schema for user registration
const signupSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  userName: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(), // 10-digit phone number
  password: Joi.string().min(6).required(),
});

// Schema for user login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  captchaToken: Joi.string().required(),
});

// Schema for OTP verification
const verifyOTPSchema = Joi.object({
  userId: Joi.string().required(),
  otp: Joi.string().length(6).required(), // Assuming OTP is 6 digits
});

// Schema for forgot password
const forgotPasswordSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(), // 10-digit phone number
});

// Schema for reset password
const resetPasswordSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),
  otp: Joi.string().length(6).required(),
  password: Joi.string().min(6).required(),
});

module.exports = {
  signupSchema,
  loginSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
