const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    match: /^[a-zA-Z0-9\s]+$/,
  },
  productCategory: {
    type: String,
    required: true,
  },
  productDescription: {
    type: String,
    required: true,
  },

  productImage: {
    type: String,
    required: true,
  },
  productPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  productQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const Product = mongoose.model("products", productSchema);

module.exports = Product;
