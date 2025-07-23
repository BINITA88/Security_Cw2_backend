const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe("sk_test_XXXXXXXXXXXXXXXXXXXXXXXX"); // Replace with your Stripe secret key

router.post("/charge", async (req, res) => {
  try {
    const { payment_method_id, amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "npr",
      payment_method: payment_method_id,
      confirm: true,
    });

    res.status(200).json({ success: true, paymentIntent });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
