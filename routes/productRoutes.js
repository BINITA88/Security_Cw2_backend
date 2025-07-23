const router = require("express").Router();
const productController = require("../controllers/productController");
const { bookishProtectAuth, adminGuard } = require("../middleware/protect");
const { body, query,validationResult } = require("express-validator");

router.post(
  "/create",
  [
    // Validate and sanitize input fields
    body("productName")
      .notEmpty()
      .withMessage("Product name is required")
      .trim()
      .escape(),
    body("productCategory")
      .notEmpty()
      .withMessage("Product category is required")
      .trim()
      .escape(),
    body("productDescription")
      .notEmpty()
      .withMessage("Product description is required")
      .trim()
      .escape(),
    body("productPrice")
      .isFloat({ min: 0 })
      .withMessage("Price must be a positive number"),
    body("productQuantity")
      .isInt({ min: 0 })
      .withMessage("Quantity must be a positive integer"),
  ],
  (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    // If no errors, proceed to the controller
    next();
  },
  productController.createProduct
);
router.get("/get_all_products", bookishProtectAuth, productController.getAllProducts);
router.get("/get_one_product/:id", productController.getOneProduct, bookishProtectAuth);
router.put("/update_product/:id", productController.updateProduct, adminGuard);
router.delete("/delete/:id", productController.deleteProduct, adminGuard);
router.get("/get_paginated_products", productController.getProductsPagination);
router.get("/get_products_count", productController.getProductCount);
router.get(
  "/search",
  [
    // Validate and sanitize the search query
    query("q")
      .notEmpty()
      .withMessage("Search query is required")
      .trim()
      .escape()
      .isLength({ max: 100 })
      .withMessage("Search query must be less than 100 characters"),
  ],



  
  (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    // If no errors, proceed to the controller
    next();
  },
  productController.searchProducts
);
router.get("/recommend/:category", productController.getRecommendedProducts); // Add this line

module.exports = router;
