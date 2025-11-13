const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  description: String,
  images: [
    {
      public_id: String,
      url: String
    }
  ],
  newproductPrice: Number,
  oldproductPrice: Number,
  date: { type: Date, default: Date.now },
  is_available: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  reviews: [
    {
      username: String,
      rating: Number,
      comments: String
    }
  ],
  colors: [String],
  sizes: [String],
});

module.exports = mongoose.model('products', productSchema);
