const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slugify = require("slugify");

const listingSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true, trim: true },
  description: { type: String, required: true },
  image: {
    filename: { type: String, default: "productimage" },
    url: {
      type: String,
      required: true,
      default: "https://images.unsplash.com/photo-1586201375761-83865001e31c"
    }
  },
  price: { type: Number, required: true, min: 0 },
  location: { type: String, required: true },
  country: { type: String, required: true },
  inStock: { type: Number, required: true, min: 0 },
  weight: {
    value: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ['g', 'kg', 'ml', 'l', 'piece', 'box', 'pt', 'qt', 'oz', 'fl oz','gal','lb'], required: true }
  },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Automatically generate slug from title before saving
listingSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true });
  }
  this.updatedAt = Date.now();
  next();
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
