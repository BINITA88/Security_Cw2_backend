const mongoose = require('mongoose');
 
 
const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    quantity: {
        type: Number,
        default: 1,
       
    },
    status:{
        type:String,
        default:"active"
    }
   
});
 
const Cart = mongoose.model('Cart', cartSchema);
 
module.exports = Cart;