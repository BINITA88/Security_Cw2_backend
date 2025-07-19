const path = require("path");
const userModel = require("../models/userModel");
const productModel = require("../models/productModel");
const cartModel = require("../models/cartModel");
const fs = require("fs");


// Add items to user cart
const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;

  // ✅ Correct usage
  const userId = req.user.id;
  console.log("Cart add by user:", userId);

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    // ✅ Check if product already in cart for this user
    const existingProduct = await cartModel.findOne({
      productId: productId,
      userId: userId, // ✅ fix here
      status: "active",
    });

    if (existingProduct) {
      return res.json({
        success: false,
        message: "Product already in cart!",
      });
    }

    // ✅ Create and save new cart item
    const cart = new cartModel({
      productId,
      userId, // ✅ fix here
      quantity,
    });

    await cart.save();

    res.status(201).json({
      success: true,
      message: "Product added to cart successfully!",
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};




// remove items from user cart
const removeFromCart = async (req, res) => {
  console.log(req.params);
  const id = req.params.id;

  try {
    const existingProduct = await cartModel.findById(id);
    if (!existingProduct) {
      return res.json({
        success: false,
        message: "Product not found in cart!",
      });
    }

    await cartModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Product removed from cart successfully!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

// fetch user cart data
const getCart = async (req, res) => {
  const id = req.user.id;

  try {
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    const cartItems = await cartModel
      .find({ userId: id, status: "active" })
      .populate("productId");
    console.log(cartItems);

    res.status(200).json({
      success: true,
      products: cartItems,
      message: "Cart items fetched successfully!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

const getActiveCart = async (req, res) => {
  const id = req.user.id;

  try {
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    const cartItems = await cartModel
      .find({ userId: id, status: "active" })
      .populate("productId");
    console.log(cartItems);

    res.status(200).json({
      success: true,
      products: cartItems,
      message: "Cart items fetched successfully!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

const updateStatus = async (req, res) => {
  const status = "inactive";
  const id = req.user.id;

  try {
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    await cartModel.updateMany({ userId: id }, { status: status });

    res.status(200).json({
      success: true,
      message: "Cart status updated successfully!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

// update the quantity of the product in the cart
const updateQuantity = async (req, res) => {
  const { productId, quantity } = req.body;
  const id = req.user.id;

  try {
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    const existingProduct = await cartModel.findOne({
      productId: productId,
      userId: id,
      status: "active",
    });
    if (!existingProduct) {
      return res.json({
        success: false,
        message: "Product not found in cart!",
      });
    }

    await cartModel.updateOne(
      { productId: productId, userId: id, status: "active" },
      { quantity: quantity }
    );

    res.status(200).json({
      success: true,
      message: "Cart updated successfully!",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

module.exports = {
  addToCart,
  removeFromCart,
  getCart,
  updateQuantity,
  getActiveCart,
  updateStatus,
};
