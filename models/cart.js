const mongoose = require('mongoose');
const cartItemSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
    quantity: Number
});
const cartSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [cartItemSchema],
    totalPrice: { type: Number, default: 0 },
    totalItems: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', cartSchema);
