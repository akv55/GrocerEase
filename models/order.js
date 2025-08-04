const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number },
      price: { type: Number } // product price at the time of purchase
    }
  ],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },
  deliveryAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
  paymentMethod: { type: String, enum: ['COD', 'Online'], required: true },
  orderedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
