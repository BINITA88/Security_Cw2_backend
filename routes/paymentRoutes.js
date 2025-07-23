const router = require("express").Router();

const paymentController = require("../controllers/paymentController");
const { bookishProtectAuth } = require("../middleware/protect");

router.post("/initialize-khalti", paymentController.initializePayment);
router.get("/complete-khalti-payment", paymentController.completeKhaltiPayment);

module.exports = router;
