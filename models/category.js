const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
    name: String,
    image: {
        type: String,
        default: "https://example.com/default-category-image.jpg" // Placeholder image URL
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt fields


});
module.exports = mongoose.model('Category', categorySchema);
