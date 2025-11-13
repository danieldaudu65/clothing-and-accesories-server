// models/order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products' },
            quantity: Number,
            price: Number,
            selectedOptions: {
                size: String,
                color: String,
            },
        },
    ],
    address: {
        firstName: String,
        lastName: String,
        email: String,
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String,
        phone: String,
    },
    totalAmount: Number,
    paymentReference: { type: String },
    paymentStatus: { type: String, default: 'pending' }, // pending, success, failed
    orderStatus: { type: String, default: 'processing' }, // processing, shipped, delivered
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
