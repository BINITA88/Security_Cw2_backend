const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const Payment = require("../models/paymentModel");
const OrderModel = require("../models/orderModel");

// Generate HMAC SHA256 Signature
function generateHmacSignature(payload, secretKey) {
  return crypto.createHmac("sha256", secretKey).update(payload).digest("hex");
}

// POST /api/payment/webhook
router.post("/webhook", express.json(), async (req, res) => {
  const khaltiSignature = req.headers["x-khalti-signature"];
  const secretKey = process.env.KHALTI_SECRET_KEY;

  const payload = JSON.stringify(req.body);
  const expectedSignature = generateHmacSignature(payload, secretKey);

  if (expectedSignature !== khaltiSignature) {
    console.warn("❌ Signature mismatch!");
    return res.status(403).json({ success: false, message: "Invalid signature" });
  }

  // Signature valid
  const { pidx, transaction_id, status, amount, purchase_order_id } = req.body;

  try {
    const payment = await Payment.findById(purchase_order_id);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    // Update Payment Status
    payment.status = status === "Completed" ? "success" : status.toLowerCase();
    payment.transactionId = transaction_id;
    payment.pidx = pidx;
    payment.amount = amount / 100; // convert from paisa
    payment.verifiedVia = "webhook";
    await payment.save();

    // Optional: Update Order status too
    await OrderModel.findByIdAndUpdate(payment.orderId, {
      $set: { status: "Paid" },
    });

    console.log(`✅ Webhook Payment Updated: ${payment._id}`);
    return res.status(200).json({ success: true, message: "Webhook verified & processed" });

  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
