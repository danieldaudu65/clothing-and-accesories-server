const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  selectedOptions: { type: Object }
});

const userSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phoneNumber: Number,
  password: String,
  cart: [cartItemSchema],
  image: String,
  Card: String,
  savedItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'products' }],
  is_online: { type: Boolean, default: false },
  is_deleted: { type: Boolean, default: false },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  timeStamp: Number,
  addresses: [
    {
      name: String,
      number: Number,
      address: String,
      city: String,
      state: String
    }
  ]
}, { collection: 'user' });

module.exports = mongoose.model('User', userSchema);
