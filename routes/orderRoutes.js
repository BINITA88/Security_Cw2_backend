const router = require("express").Router();

const orderController = require("../controllers/oderController");

const { bookishProtectAuth, adminGuard, bookishAuthorizeRoles } = require("../middleware/protect");

router.post("/place_order", bookishProtectAuth,
  bookishAuthorizeRoles('user'),
 orderController.placeOrder);

router.get("/get_all_orders", orderController.getAllOrders);

router.get("/get_orders_by_user", bookishProtectAuth,  bookishAuthorizeRoles('user'),
 orderController.getOrdersByUser);

router.post(
  "/update_order_status/:orderId",

  orderController.updateOrderStatus
);

module.exports = router;
