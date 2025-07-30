const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slugify = require("slugify");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    filename: {
      type: String,
      default: "productimage"
    },
    url: {
      type: String,
      required: true,
      default: "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60"
    }
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },

  inStock: {
    type: Boolean,
    default: true
  },
  weight: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving

listingSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true });
  }
  this.updatedAt = Date.now();
  next();
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;