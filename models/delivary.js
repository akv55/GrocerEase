const mongoose = require('mongoose');
const deliverySchema = new mongoose.Schema({
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    delivery_status: { type: String, enum: ['Shipped', 'Out for Delivery', 'Delivered'], default: 'Shipped' },
    delivery_date: Date,
    tracking_id: String
});
module.exports = mongoose.model('Delivery', deliverySchema);
