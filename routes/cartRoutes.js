const { bookishProtectAuth, adminGuard } = require("../middleware/protect");

const cartController = require("../controllers/cartController");

const router = require("express").Router();

// Add a product to the cart
router.post("/add_to_cart", bookishProtectAuth, cartController.addToCart);

// Remove a product from the cart
router.put("/remove_from_cart/:id", cartController.removeFromCart);

// Get the cart
router.get("/get_cart", bookishProtectAuth, cartController.getActiveCart);

//Update the status
router.put("/update_status", bookishProtectAuth, cartController.updateStatus);

// Update the quantity of the product in the cart
router.put("/update_quantity", bookishProtectAuth, cartController.updateQuantity);

module.exports = router;
