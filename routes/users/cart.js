const express = require('express');
const cartrouter = express.Router();
const jwt = require('jsonwebtoken');
const Product = require('../../models/products');
const User = require('../../models/user');
require('dotenv').config();

// Middleware to get user from token
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).send({ error: 'No token provided' });

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) return res.status(401).send({ error: 'Token malformed' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const Suser = await User.findById(decoded._id);
    if (!Suser) return res.status(404).send({ error: 'User not found' });

    req.user = Suser;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).send({ error: 'Invalid token or server error' });
  }
};

// Add to cart
cartrouter.post('/addtocart', authenticateUser, async (req, res) => {
  try {
    const { productId, selectedOptions, quantity = 1 } = req.body;
    const Suser = req.user;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).send({ error: 'Product not found' });

    const existingCartItem = Suser.cart.find(
      item => item.productId.toString() === productId &&
        JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions)
    );

    if (existingCartItem) {
      existingCartItem.quantity += quantity;
    } else {
      Suser.cart.push({
        productId,
        quantity,
        price: product.newproductPrice,
        selectedOptions: selectedOptions || {}
      });
    }

    await Suser.save();

    // Populate productId before sending response
    const populatedCart = await User.findById(Suser._id).populate('cart.productId');

    res.status(200).send({
      msg: 'Item added to cart successfully',
      cart: populatedCart.cart
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Remove from cart
cartrouter.post('/removefromcart', authenticateUser, async (req, res) => {
  try {
    const { productId, selectedOptions } = req.body;
    const Suser = req.user;

    const cartItemIndex = Suser.cart.findIndex(
      item => item.productId.toString() === productId &&
        JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions)
    );

    if (cartItemIndex === -1) return res.status(400).send({ error: 'Item not found in cart' });

    if (Suser.cart[cartItemIndex].quantity > 1) {
      Suser.cart[cartItemIndex].quantity -= 1;
    } else {
      Suser.cart.splice(cartItemIndex, 1);
    }

    await Suser.save();
    // Populate productId before sending response
    const populatedCart = await User.findById(Suser._id).populate('cart.productId');

    res.status(200).send({
      msg: 'Item removed from cart',
      cart: populatedCart.cart
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Get cart
// Get cart with total count
cartrouter.get('/getcartfromuser', authenticateUser, async (req, res) => {
  try {
    const Suser = await User.findById(req.user._id).populate('cart.productId');

    // Calculate total quantity
    const totalItems = Suser.cart.reduce((acc, item) => acc + item.quantity, 0);

    res.status(200).send({
      cart: Suser.cart,
      totalItems // <-- total number of items in cart
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server error' });
  }
});


module.exports = cartrouter;
