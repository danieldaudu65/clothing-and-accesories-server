// routes/order.js
const express = require('express');
const order = require('../../models/order');
const router = express.Router();
const jwt = require('jsonwebtoken');
const user = require('../../models/user');



const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).send({ error: 'No token provided' });

        const token = authHeader.split(' ')[1]; // Bearer <token>
        if (!token) return res.status(401).send({ error: 'Token malformed' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const Suser = await user.findById(decoded._id);
        if (!Suser) return res.status(404).send({ error: 'User not found' });

        req.user = Suser;
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).send({ error: 'Invalid token or server error' });
    }
};

// Create new order
router.post('/create', authenticateUser, async (req, res) => {
    try {
        const { items, address, totalAmount, paymentStatus } = req.body;
        const user = req.user;

        const newOrder = new order({
            user: user._id,
            items,
            address,
            totalAmount,
            paymentStatus,
        });

        await newOrder.save();
        res.status(201).send({ success: true, order: newOrder });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: 'Server error' });
    }
});


// Get user orders
router.get('/my-orders', authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const orders = await order.find({ user: user._id }).populate('items.productId');
        res.status(200).send({ success: true, orders });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: 'Server error' });
    }
});


// routes/order.js
// Add this endpoint below your existing routes

// Mark order as paid
const { sendPaymentConfirmationUser, sendPaymentNotificationAdmin } = require('../../util/nodemailer');

router.post('/mark_as_paid', authenticateUser, async (req, res) => {
  try {
    const { reference, orderId } = req.body;

    if (!reference || !orderId) {
      return res.status(400).send({ success: false, error: 'Reference and orderId are required' });
    }

    // Find order
    const existingOrder = await order.findById(orderId).populate('user'); // populate user info
    if (!existingOrder) {
      return res.status(404).send({ success: false, error: 'Order not found' });
    }

    // Check if order belongs to user
    if (existingOrder.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).send({ success: false, error: 'Unauthorized' });
    }

    // Update payment status
    existingOrder.paymentStatus = 'success';
    existingOrder.paymentReference = reference;
    await existingOrder.save();

    // Send emails
    await sendPaymentConfirmationUser(existingOrder.user.email, existingOrder);
    await sendPaymentNotificationAdmin(process.env.EMAIL_USER, existingOrder);

    res.status(200).send({ success: true, msg: 'Payment confirmed', order: existingOrder });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, error: 'Server error' });
  }
});



// Get user orders
router.get('/my-orders', authenticateUser, async (req, res) => {
    try {
        const user = req.user;
        const orders = await order.find({ user: user._id }).populate('items.productId');
        res.status(200).send({ success: true, orders });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: 'Server error' });
    }
});



module.exports = router;
