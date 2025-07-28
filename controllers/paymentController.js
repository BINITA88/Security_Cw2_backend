// const {
//   initializeKhaltiPayment,
//   verifyKhaltiPayment,
// } = require("../service/khaltiService");
// const Payment = require("../models/paymentModel");
// const OrderModel = require("../models/orderModel");

// // Route to initialize Khalti payment gateway
// const initializePayment = async (req, res) => {
//   console.log(req.body);

//   try {
//     const { orderId, totalPrice, website_url } = req.body;

//     // Find the order and populate the products field
//     const itemData = await OrderModel.findOne({
//       _id: orderId,
//       totalPrice: Number(totalPrice),
//     })
//       .populate("carts")
//       .populate({
//         path: "carts",
//         populate: {
//           path: "productId",
//           model: "products",
//         },
//       });

//     if (!itemData) {
//       return res.send({
//         success: false,
//         message: "Order not found",
//       });
//     }
//     console.log(itemData.carts);
//     // Extract product names from populated products array
//     const productNames = itemData.carts
//       .map((p) => p.productId.productName)
//       .join(", ");

//     if (!productNames) {
//       return res.send({
//         success: false,
//         message: "No product names found",
//       });
//     }

//     // Create a payment document without transactionId initially
//     const OrderModelData = await Payment.create({
//       orderId: orderId,
//       paymentGateway: "khalti",
//       amount: totalPrice,
//       status: "pending", // Set the initial status to pending
//     });

//     // Initialize the Khalti payment
//     const paymentInitate = await initializeKhaltiPayment({
//       amount: totalPrice * 100, // amount should be in paisa (Rs * 100)
//       purchase_order_id: OrderModelData._id, // purchase_order_id because we need to verify it later
//       purchase_order_name: productNames,
//       return_url: `https://localhost:5000/api/khalti/complete-khalti-payment`,
//       website_url: website_url || "https://localhost:3000",
//     });

//     // Update the payment record with the transactionId and pidx
//     await Payment.updateOne(
//       { _id: OrderModelData._id },
//       {
//         $set: {
//           transactionId: paymentInitate.pidx, // Assuming pidx as transactionId from Khalti response
//           pidx: paymentInitate.pidx,
//         },
//       }
//     );

//     res.json({
//       success: true,
//       OrderModelData,
//       payment: paymentInitate,
//       pidx: paymentInitate.pidx,
//     });
//   } catch (error) {
//     res.json({
//       success: false,
//       error: error.message || "An error occurred",
//     });
//   }
// };

// // This is our return URL where we verify the payment done by the user
// const completeKhaltiPayment = async (req, res) => {
//   const { pidx, amount, purchase_order_id } = req.query;

//   try {
//     const paymentInfo = await verifyKhaltiPayment(pidx);

//     // Validate the payment info
//     if (
//       paymentInfo?.status !== "Completed" || // Ensure the status is "Completed"
//       paymentInfo.pidx !== pidx || // Verify pidx matches
//       Number(paymentInfo.total_amount) !== Number(amount) // Compare the total amount
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Incomplete or invalid payment information",
//         paymentInfo,
//       });
//     }

//     // // Check if payment corresponds to a valid order
//     // const purchasedItemData = await OrderModel.findOne({
//     //   _id: purchase_order_id,
//     //   totalPrice: amount,
//     // });

//     // if (!purchasedItemData) {
//     //   return res.status(404).json({
//     //     success: false,
//     //     message: "Order data not found",
//     //   });
//     // }

//     // Update the order status to 'completed'
//     // await Payment.findByIdAndUpdate(
//     //   purchase_order_id,
//     //   {
//     //     $set: {
//     //       status: "completed",
//     //     },
//     //   }
//     // );

//     // Update payment record with verification data
//     const paymentData = await Payment.findOneAndUpdate(
//       { _id: purchase_order_id },
//       {
//         $set: {
//           pidx,
//           transactionId: paymentInfo.transaction_id,
//           // dataFromVerificationReq: paymentInfo,
//           // apiQueryFromUser: req.query,
//           status: "success",
//         },
//       },
//       { new: true }
//     );
//     res.redirect(`https://test-pay.khalti.com/?pidx=${pidx}`);

//     // // Send success response
//     // res.json({
//     //   success: true,
//     //   message: "Payment Successful",
//     //   paymentData,
//     // });
//   } catch (error) {
//     console.error("Error verifying payment:", error);
//     res.status(500).json({
//       success: false,
//       message: "An error occurred during payment verification",
//       error: error.message || "An unknown error occurred",
//     });
//   }
// };

// module.exports = { initializePayment, completeKhaltiPayment };


// const express = require("express");
// const crypto = require("crypto");
// const {
//   initializeKhaltiPayment,
//   verifyKhaltiPayment,
// } = require("../service/khaltiService");
// const Payment = require("../models/paymentModel");
// const OrderModel = require("../models/orderModel");

// // Generate HMAC SHA256 Signature
// function generateHmacSignature(payload, secretKey) {
//   return crypto.createHmac("sha256", secretKey).update(payload).digest("hex");
// }

// // Route to initialize Khalti payment gateway
// const initializePayment = async (req, res) => {
//   console.log(req.body);

//   try {
//     const { orderId, totalPrice, website_url } = req.body;

//     const itemData = await OrderModel.findOne({
//       _id: orderId,
//       totalPrice: Number(totalPrice),
//     })
//       .populate("carts")
//       .populate({
//         path: "carts",
//         populate: {
//           path: "productId",
//           model: "products",
//         },
//       });

//     if (!itemData) {
//       return res.send({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     const productNames = itemData.carts
//       .map((p) => p.productId.productName)
//       .join(", ");

//     if (!productNames) {
//       return res.send({
//         success: false,
//         message: "No product names found",
//       });
//     }

//     const OrderModelData = await Payment.create({
//       orderId: orderId,
//       paymentGateway: "khalti",
//       amount: totalPrice,
//       status: "pending",
//     });

//     const paymentInitate = await initializeKhaltiPayment({
//       amount: totalPrice * 100,
//       purchase_order_id: OrderModelData._id,
//       purchase_order_name: productNames,
//       return_url: `https://localhost:5000/api/khalti/complete-khalti-payment`,
//       website_url: website_url || "https://localhost:3000",
//     });

//     await Payment.updateOne(
//       { _id: OrderModelData._id },
//       {
//         $set: {
//           transactionId: paymentInitate.pidx,
//           pidx: paymentInitate.pidx,
//         },
//       }
//     );

//     res.json({
//       success: true,
//       OrderModelData,
//       payment: paymentInitate,
//       pidx: paymentInitate.pidx,
//     });
//   } catch (error) {
//     res.json({
//       success: false,
//       error: error.message || "An error occurred",
//     });
//   }
// };

// const completeKhaltiPayment = async (req, res) => {
//   const { pidx, amount, purchase_order_id } = req.query;

//   try {
//     const paymentInfo = await verifyKhaltiPayment(pidx);

//     if (
//       paymentInfo?.status !== "Completed" ||
//       paymentInfo.pidx !== pidx ||
//       Number(paymentInfo.total_amount) !== Number(amount)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Incomplete or invalid payment information",
//         paymentInfo,
//       });
//     }

//     const paymentData = await Payment.findOneAndUpdate(
//       { _id: purchase_order_id },
//       {
//         $set: {
//           pidx,
//           transactionId: paymentInfo.transaction_id,
//           status: "success",
//         },
//       },
//       { new: true }
//     );
//     res.redirect(`https://test-pay.khalti.com/?pidx=${pidx}`);
//   } catch (error) {
//     console.error("Error verifying payment:", error);
//     res.status(500).json({
//       success: false,
//       message: "An error occurred during payment verification",
//       error: error.message || "An unknown error occurred",
//     });
//   }
// };

// const handleKhaltiWebhook = async (req, res) => {
//   console.log("📩 Webhook received from Khalti:", req.body);
//   const khaltiSignature = req.headers["x-khalti-signature"];
//   const secretKey = process.env.KHALTI_SECRET_KEY;

//   const payload = JSON.stringify(req.body);
//   const expectedSignature = generateHmacSignature(payload, secretKey);

//   if (expectedSignature !== khaltiSignature) {
//     console.warn("❌ Signature mismatch!");
//     return res.status(403).json({ success: false, message: "Invalid signature" });
//   }

//   const { pidx, transaction_id, status, amount, purchase_order_id } = req.body;

//   try {
//     const payment = await Payment.findById(purchase_order_id);
//     if (!payment) {
//       return res.status(404).json({ success: false, message: "Payment not found" });
//     }

//     payment.status = status === "Completed" ? "success" : status.toLowerCase();
//     payment.transactionId = transaction_id;
//     payment.pidx = pidx;
//     payment.amount = amount / 100;
//     payment.verifiedVia = "webhook";
//     await payment.save();

//     await OrderModel.findByIdAndUpdate(payment.orderId, {
//       $set: { status: "Paid" },
//     });

//     console.log(`✅ Webhook Payment Updated: ${payment._id}`);
//     return res.status(200).json({ success: true, message: "Webhook verified & processed" });
//   } catch (error) {
//     console.error("Webhook Error:", error);
//     return res.status(500).json({ success: false, error: error.message });
//   }
// };

// module.exports = { initializePayment, completeKhaltiPayment, handleKhaltiWebhook };


const express = require("express");
const crypto = require("crypto");
const {
  initializeKhaltiPayment,
} = require("../service/khaltiService");
const Payment = require("../models/paymentModel");
const OrderModel = require("../models/orderModel");

// Generate HMAC SHA256 Signature
function generateHmacSignature(payload, secretKey) {
  return crypto.createHmac("sha256", secretKey).update(payload).digest("hex");
}

// Route to initialize Khalti payment gateway
const initializePayment = async (req, res) => {
  console.log(req.body);

  try {
    const { orderId, totalPrice, website_url } = req.body;

    const itemData = await OrderModel.findOne({
      _id: orderId,
      totalPrice: Number(totalPrice),
    })
      .populate("carts")
      .populate({
        path: "carts",
        populate: {
          path: "productId",
          model: "products",
        },
      });

    if (!itemData) {
      return res.send({
        success: false,
        message: "Order not found",
      });
    }

    const productNames = itemData.carts
      .map((p) => p.productId.productName)
      .join(", ");

    if (!productNames) {
      return res.send({
        success: false,
        message: "No product names found",
      });
    }

    const OrderModelData = await Payment.create({
      orderId: orderId,
      paymentGateway: "khalti",
      amount: totalPrice,
      status: "pending",
    });

    const paymentInitate = await initializeKhaltiPayment({
      amount: totalPrice * 100,
      purchase_order_id: OrderModelData._id,
      purchase_order_name: productNames,
      return_url: `https://localhost:3000/payment/success`,
      website_url: website_url || "https://localhost:3000",
    });

    await Payment.updateOne(
      { _id: OrderModelData._id },
      {
        $set: {
          transactionId: paymentInitate.pidx,
          pidx: paymentInitate.pidx,
        },
      }
    );

    res.json({
      success: true,
      OrderModelData,
      payment: paymentInitate,
      pidx: paymentInitate.pidx,
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message || "An error occurred",
    });
  }
};

const handleKhaltiWebhook = async (req, res) => {
  console.log("📩 Webhook received from Khalti:", req.body);
  const khaltiSignature = req.headers["x-khalti-signature"];
  const secretKey = process.env.KHALTI_SECRET_KEY;

  const payload = JSON.stringify(req.body);
  const expectedSignature = generateHmacSignature(payload, secretKey);

  if (expectedSignature !== khaltiSignature) {
    console.warn("❌ Signature mismatch!");
    return res.status(403).json({ success: false, message: "Invalid signature" });
  }

  const { pidx, transaction_id, status, amount, purchase_order_id } = req.body;

  try {
    const payment = await Payment.findById(purchase_order_id);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    payment.status = status === "Completed" ? "success" : status.toLowerCase();
    payment.transactionId = transaction_id;
    payment.pidx = pidx;
    payment.amount = amount / 100;
    payment.verifiedVia = "webhook";
    await payment.save();

    await OrderModel.findByIdAndUpdate(payment.orderId, {
      $set: { status: "Paid" },
    });

    console.log(`✅ Webhook Payment Updated: ${payment._id}`);
    return res.status(200).json({ success: true, message: "Webhook verified & processed" });
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { initializePayment, handleKhaltiWebhook };
