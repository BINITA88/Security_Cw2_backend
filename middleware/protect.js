
const jwt = require("jsonwebtoken");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const userModel = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET;
const bookishProtectAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authorization header missing",
    });
  }
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token not found",
    });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await userModel.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("bookishauthGuard error occured:", error);
    res.status(401).json({
      success: false,
      message: "You are not authorized",
    });
  }
};


const bookishAuthorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Insufficient privileges",
      });
    }
    next();
  };
};


const adminGuard = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(400).json({
      success: false,
      message: "Auth header not found",
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Token not found",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Not authorized",
    });
  }
};

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  handler: (req, res) => {
    res.json({
      success: false,
      message:
        "Too many password reset attempts from this IP, please try again after 10 minutes",
    });
  },
});

const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
};

const verifyRecaptcha = async (req, res, next) => {
  const recaptchaResponse = req.body["recaptchaToken"];

  if (!recaptchaResponse) {
    return res.status(400).json({
      success: false,
      message: "reCAPTCHA token not found",
    });
  }

  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: secretKey,
          response: recaptchaResponse,
        },
      }
    );

    const data = response.data;
    if (data.success) {
      next();
    } else {
      res.status(401).json({
        success: false,
        message: "reCAPTCHA verification failed",
      });
    }
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying reCAPTCHA",
    });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Unauthorized: Admin access required",
    });
  }
};

module.exports = {
  bookishProtectAuth,
  adminGuard,
  bookishAuthorizeRoles,
  forgotPasswordLimiter,
  validateRequest,
  verifyRecaptcha,
  isAdmin,
};
