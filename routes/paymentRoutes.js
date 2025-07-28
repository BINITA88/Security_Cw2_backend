// const router = require("express").Router();

// const paymentController = require("../controllers/paymentController");
// const { bookishProtectAuth } = require("../middleware/protect");

// router.post("/initialize-khalti", paymentController.initializePayment);
// router.get("/complete-khalti-payment", paymentController.completeKhaltiPayment);

// module.exports = router;


const router = require("express").Router();
const express = require("express"); // ✅ This is missing

const paymentController = require("../controllers/paymentController");
const { bookishProtectAuth } = require("../middleware/protect");

// Initialize Khalti Payment
router.post("/initialize-khalti", paymentController.initializePayment);

// Complete Khalti Payment (callback URL after payment)
// router.get("/complete-khalti-payment", paymentController.completeKhaltiPayment);

// ✅ Khalti Webhook Endpoint (DO NOT protect this with auth)
router.post("/webhook", express.json(), paymentController.handleKhaltiWebhook);

module.exports = router;
