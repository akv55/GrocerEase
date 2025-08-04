const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  order_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true 
  },
  delivery_status: { 
    type: String, 
    enum: ['Shipped', 'Out for Delivery', 'Delivered'], 
    default: 'Shipped' 
  },
  delivery_date: { 
    type: Date 
  },
  tracking_id: { 
    type: String, 
    required: true, 
    unique: true 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Delivery', deliverySchema);
