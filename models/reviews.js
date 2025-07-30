const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    review_date: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Review', reviewSchema);
