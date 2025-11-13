const express = require('express');
const router = express.Router();
const Order = require('../../models/order');
const OrderItem = require('../../models/orderItems');
const User = require('../../models/user');
const jwt = require('jsonwebtoken');

// Helper function to verify token
const verifyToken = (req) => {
  const authHeader = req.header('Authorization'); // expects "Bearer <token>"
  if (!authHeader) throw new Error('No token provided');
  const token = authHeader.split(' ')[1];
  if (!token) throw new Error('Invalid token format');
  return jwt.verify(token, process.env.JWT_SECRET);
};

// GET all orders
router.get('/get-all-orders', async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'fullName')
      .populate('items.productId', 'name')
      .sort({ createdAt: -1 });

    if (!orders.length)
      return res.status(404).json({ status: false, msg: 'No orders found' });

    res.status(200).json({ status: true, msg: `Found ${orders.length} orders`, orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, msg: 'Server error' });
  }
});

// GET one order for authenticated user
router.get('/get-one-order', async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const user = await User.findById(decoded._id);
    if (!user) return res.status(404).json({ status: false, msg: 'User not found' });

    const order = await Order.findOne({ user: user._id })
      .populate('user', 'fullName')
      .populate({ path: 'items.productId', select: 'name' })
      .sort({ createdAt: -1 });

    if (!order) return res.status(404).json({ status: false, msg: 'No orders found for this user' });

    res.status(200).json({ status: true, order });
  } catch (err) {
    console.error(err);
    res.status(401).json({ status: false, msg: 'Invalid or missing token' });
  }
});

// CREATE order
router.post('/create-order', async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const user = await User.findById(decoded._id);
    if (!user) return res.status(404).json({ status: false, msg: 'User not found' });

    const { orderItems } = req.body;
    if (!Array.isArray(orderItems) || !orderItems.length)
      return res.status(400).json({ status: false, msg: 'orderItems must be a non-empty array' });

    const itemsIds = [];
    let totalAmount = 0;

    for (const item of orderItems) {
      if (!item.product || !item.quantity || !item.productPrice)
        return res.status(400).json({ status: false, msg: 'Invalid order item' });

      const newItem = new OrderItem({ product: item.product, quantity: item.quantity });
      const savedItem = await newItem.save();
      itemsIds.push(savedItem._id);
      totalAmount += item.productPrice * item.quantity;
    }

    const order = new Order({
      user: user._id,
      items: itemsIds,
      totalAmount,
      status: 'pending',
    });

    const savedOrder = await order.save();
    res.status(201).json({ status: true, order: savedOrder });
  } catch (err) {
    console.error(err);
    res.status(401).json({ status: false, msg: 'Invalid or missing token' });
  }
});

// UPDATE order status
router.put('/update-order', async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { orderId, status } = req.body;
    if (!orderId || !status) return res.status(400).json({ status: false, msg: 'Missing orderId or status' });

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });

    res.status(200).json({ status: true, order });
  } catch (err) {
    console.error(err);
    res.status(401).json({ status: false, msg: 'Invalid or missing token' });
  }
});

// DELETE order
router.delete('/delete-order', async (req, res) => {
  try {
    const decoded = verifyToken(req);
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ status: false, msg: 'Missing orderId' });

    const order = await Order.findOne({ _id: orderId, user: decoded._id });
    if (!order) return res.status(404).json({ status: false, msg: 'Order not found' });

    await Order.findByIdAndDelete(orderId);
    res.status(200).json({ status: true, msg: 'Order deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(401).json({ status: false, msg: 'Invalid or missing token' });
  }
});

// GET total sales
router.get('/get-total-sale', async (req, res) => {
  try {
    const totalSales = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const total = totalSales[0]?.total || 0;
    res.status(200).json({ status: true, totalSales: total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, msg: 'Server error' });
  }
});

// GET total order count
router.get('/get-total-order-count', async (req, res) => {
  try {
    const count = await Order.countDocuments();
    res.status(200).json({ status: true, totalOrders: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, msg: 'Server error' });
  }
});

module.exports = router;
