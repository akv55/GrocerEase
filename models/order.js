const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [{
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number
    }],
    total_amount: Number,
    order_date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'Delivered', 'Cancelled'], default: 'Pending' }
});
module.exports = mongoose.model('Order', orderSchema);

