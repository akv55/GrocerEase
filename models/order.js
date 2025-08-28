const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    orderId: { type: String, unique: true }, // custom Order ID
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
            name: String, // snapshot of product name
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true, min: 0 }
        }
    ],
    totalAmount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    deliveryAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
    paymentMethod: { type: String, enum: ['COD', 'Online'], required: true },
    paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' }
}, { timestamps: true });

// Auto-generate orderId and calculate totalAmount
orderSchema.pre('save', async function (next) {
    if (!this.orderId) {
    const randomNum = Math.floor(10000 + Math.random() * 90000); // 5 digit random
    const today = new Date().toISOString().slice(0,10).replace(/-/g, ""); 
    this.orderId = `ORD${today}${randomNum}`;  
  }
    // Calculate totalAmount from items
    this.totalAmount = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    next();
});

module.exports = mongoose.model("Order", orderSchema);
