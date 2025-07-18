const path = require("path");
const productModel = require("../models/productModel");
const fs = require("fs");

const createProduct = async (req, res) => {
  console.log(req.body);
  console.log(req.files);

  // Destructuring the body
  const {
    productName,
    productCategory,
    productDescription,
    productPrice,
    productQuantity,
  } = req.body;
  // Sanitize input to handle duplicate parameters
  const sanitizedProductName = Array.isArray(productName)
    ? productName[0]
    : productName;
  const sanitizedProductCategory = Array.isArray(productCategory)
    ? productCategory[0]
    : productCategory;
  const sanitizedProductDescription = Array.isArray(productDescription)
    ? productDescription[0]
    : productDescription;
  const sanitizedProductPrice = Array.isArray(productPrice)
    ? parseFloat(productPrice[0])
    : parseFloat(productPrice);
  const sanitizedProductQuantity = Array.isArray(productQuantity)
    ? parseInt(productQuantity[0])
    : parseInt(productQuantity);

  // Validating the data
  if (
    !sanitizedProductName ||
    !sanitizedProductCategory ||
    !sanitizedProductDescription ||
    isNaN(sanitizedProductPrice) ||
    isNaN(sanitizedProductQuantity)
  ) {
    return res.status(400).json({
      success: false,
      message: "Please enter all fields!",
    });
  }

  // Validate that price and quantity are not negative
  if (sanitizedProductPrice < 0 || sanitizedProductQuantity < 0) {
    return res.status(400).json({
      success: false,
      message: "Price and quantity cannot be negative!",
    });
  }

  // Validating the image
  if (!req.files || !req.files.productImage) {
    return res.status(400).json({
      success: false,
      message: "Please upload an image!",
    });
  }

  const { productImage } = req.files;

  // Upload the image
  // 1. Generate new image name
  const imageName = `${Date.now()}-${productImage.name}`;

  // 2. Make an upload path (/path/upload - directory)
  const imageUploadPath = path.join(
    __dirname,
    `../public/products/${imageName}`
  );

  // 3. Move to that directory (await, try catch)
  try {
    await productImage.mv(imageUploadPath);

    // save the product to the database
    const newProduct = new productModel({
      productName: productName,
      productCategory: productCategory,
      productDescription: productDescription,
      productPrice: productPrice,
      productQuantity: productQuantity,
      productImage: imageName,
    });

    const product = await newProduct.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: "error",
    });
  }
};
// Fetch all products
const getAllProducts = async (req, res) => {
  try {
    const allProducts = await productModel.find({});

    res.status(201).json({
      success: true,
      message: "All products fetched successfully",
      products: allProducts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};

// Get one product
const getOneProduct = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product: product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    // No product
    const product = await productModel.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Validate that price and quantity are not negative
    if (req.body.productPrice < 0 || req.body.productQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Price and quantity cannot be negative!",
      });
    }

    // If there is image
    if (req.files && req.files.productImage) {
      // Destructuring the body
      const { productImage } = req.files;

      // Upload image to /public/image
      // 1. Generate new image name
      const imageName = `${Date.now()}-${productImage.name}`;

      // 2. Make an upload path (/path/upload - directory)
      const imageUploadPath = path.join(
        __dirname,
        `../public/products/${imageName}`
      );

      // 3, Move to that directory
      await productImage.mv(imageUploadPath);

      // req.params.id  (id), req.body (productName, productCategory, productDescription, productPrice)
      req.body.productImage = imageName;

      // if image is uploaded and req.body is updated
      if (req.body.productImage) {
        const existingProduct = await productModel.findById(req.params.id);
        imagePath = path.join(
          __dirname,
          `../public/products/${existingProduct.productImage}`
        );

        // Delete the existing image
        fs.unlinkSync(imagePath);
      }
    }
    const updatedProduct = await productModel.findByIdAndUpdate(
      req.params.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Product updated successfully",
      updatedProduct: updatedProduct,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.id);

    res.status(201).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};

const getProductsPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit || 10;

    const products = await productModel
      .find({})
      .skip((page - 1) * limit)
      .limit(limit);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Products not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      products: products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};

const getProductCount = async (req, res) => {
  try {
    const productCount = await productModel.countDocuments({});

    res.status(200).json({
      success: true,
      message: "Product count fetched successfully",
      productCount: productCount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};

// Search Products
const searchProducts = async (req, res) => {
  try {
    // Step 1: Get the search query from the request
    const searchQuery = req.query.q;

    // Step 2: Validate and sanitize the input
    if (!searchQuery || typeof searchQuery !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search query is required and must be a string.",
      });
    }

    // Sanitize the input to remove special characters
    const sanitizedQuery = searchQuery.replace(/[^\w\s]/gi, "");

    if (!sanitizedQuery) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid search input. Only alphanumeric characters and spaces are allowed.",
      });
    }

    // Step 3: Limit the input length to prevent abuse
    if (sanitizedQuery.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search query is too long. Maximum length is 100 characters.",
      });
    }

    // Step 4: Perform the search using a parameterized query
    const products = await productModel.find({
      productName: { $regex: sanitizedQuery, $options: "i" }, // Case-insensitive search
    });

    // Step 5: Log the search query for monitoring
    console.log(`Search query: ${sanitizedQuery}`);

    // Step 6: Return the results
    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      products: products,
    });
  } catch (error) {
    console.error("Error in searchProducts:", error);

    // Step 7: Handle errors gracefully
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Recommended Products
const getRecommendedProducts = async (req, res) => {
  const { category } = req.params;

  try {
    const recommendedProducts = await productModel
      .find({ productCategory: category })
      .limit(4); // Limit to 4 recommendations
    res.status(200).json({
      success: true,
      products: recommendedProducts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error,
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getOneProduct,
  updateProduct,
  deleteProduct,
  getProductsPagination,
  getProductCount,
  searchProducts,
  getRecommendedProducts,
};
