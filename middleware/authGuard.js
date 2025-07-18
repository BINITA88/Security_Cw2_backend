// const userModel = require("../models/userModel");
// const jwt = require("jsonwebtoken");

// const axios = require("axios");
// const { StatusCodes } = require("http-status-codes");
// const rateLimit = require("express-rate-limit");

// const JWT_SECRET = "myverysecurekey123"; 


// const authGuard = async (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];

//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       message: "No token provided",
//     });
//   }

//   try {
//     const decoded = jwt.verify(token, JWT_SECRET);
//     const user = await userModel.findById(decoded.id).select("-password");

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     if (error.name === "TokenExpiredError") {
//       return res.status(401).json({
//         success: false,
//         message: "Token expired. Please log in again.",
//       });
//     }
//     res.status(500).json({
//       success: false,
//       message: "Not authorized",
//     });
//   }
// };

// // Admin guard
// const adminGuard = (req, res, next) => {
//   //check incoming data
//   console.log(req.headers);
//   // passed going to next

//   // get authorization data fromheader
//   const authHeader = req.headers.authorization;

//   // check or validate
//   if (!authHeader) {
//     return res.status(400).json({
//       success: false,
//       message: "Auth header not found",
//     });
//   }

//   // Split the data(Format: Bearer token)
//   const token = authHeader.split(" ")[1];

//   // if token not found : stop the process (res)
//   if (!token || token === "") {
//     return res.status(400).json({
//       success: false,
//       message: "Token not found",
//     });
//   }

//   // verify
//   try {
//     const decodeUserData = jwt.verify(token, process.env.JWT_SECRET);
//     console.log(decodeUserData);
//     req.user = decodeUserData; //id, isAdmin
//     if (!req.user.isAdmin) {
//       return res.status(400).json({
//         success: false,
//         message: "Prabesh Nised!", //Permission Denied
//       });
//     }
//     next();
//   } catch (error) {
//     res.status(500).json({
//       sucess: false,
//       message: "Not Authorized",
//     });
//   }
//   // if verified : next (function is controller)

//   // not verified : not auth
// };
// const forgotPasswordLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 3,
//   handler: (req, res) => {
//     res.json({
//       success: false,
//       message:
//         "Too many password reset attempts from this IP, please try again after 15 minutes",
//     });
//   },
// });
// const validateRequest = (schema) => (req, res, next) => {
//   const { error } = schema.validate(req.body);
//   if (error) {
//     return res.status(400).json({
//       success: false,
//       message: error.details[0].message,
//     });
//   }
//   next();
// };

// const verifyRecaptcha = async (req, res, next) => {
//   console.log(req.body);
//   const recaptchaResponse = req.body["recaptchaToken"];

//   if (!recaptchaResponse) {
//     return res.status(httpStatus.BAD_REQUEST).json({
//       success: false,
//       message: "reCAPTCHA token not found",
//     });
//   }

//   try {
//     const secretKey = process.env.RECAPTCHA_SECRET_KEY;
//     const response = await axios.post(
//       `https://www.google.com/recaptcha/api/siteverify`,
//       null,
//       {
//         params: {
//           secret: secretKey,
//           response: recaptchaResponse,
//         },
//       }
//     );

//     const data = response.data;
//     console.log(data);
//     if (data.success) {
//       next();
//     } else {
//       res.status(httpStatus.UNAUTHORIZED).json({
//         success: false,
//         message: "reCAPTCHA verification failed",
//       });
//     }
//   } catch (error) {
//     console.error("Error verifying reCAPTCHA:", error);
//     res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: "Error verifying reCAPTCHA",
//     });
//   }
// };

// const isAdmin = (req, res, next) => {
//   if (req.user && req.user.isAdmin) {
//     next();
//   } else {
//     res.status(403).json({
//       success: false,
//       message: "Unauthorized: Admin access required",
//     });
//   }
// };
// module.exports = {
//   authGuard,
//   adminGuard,
//   forgotPasswordLimiter,
//   validateRequest,
//   verifyRecaptcha,
//   isAdmin,
// };


const jwt = require("jsonwebtoken");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const userModel = require("../models/userModel");

// use secret from .env
const JWT_SECRET = process.env.JWT_SECRET || "fallbackSecret";

// ================== AUTH GUARD ==================
const authGuard = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
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
    console.log("user",user)
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Not authorized",
    });
  }
};

// ================== ADMIN GUARD ==================
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

// ================== RATE LIMIT ==================
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  handler: (req, res) => {
    res.json({
      success: false,
      message:
        "Too many password reset attempts from this IP, please try again after 15 minutes",
    });
  },
});

// ================== VALIDATOR ==================
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

// ================== reCAPTCHA GUARD ==================
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

// ================== isAdmin CHECK ==================
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
  authGuard,
  adminGuard,
  forgotPasswordLimiter,
  validateRequest,
  verifyRecaptcha,
  isAdmin,
};
