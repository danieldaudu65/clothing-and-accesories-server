const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    quantity: Number,
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products'
    },
    date: {
        type: Date,
        default: Date.now
    },
});

const OrderItem = mongoose.model('OrderItem', orderItemSchema);
module.exports = OrderItem;



// user_id