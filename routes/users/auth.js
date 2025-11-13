const express = require('express');
const authrouter = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../models/user'); // Capitalized
require('dotenv').config();

// Signup endpoint
authrouter.post('/signup', async (req, res) => {
    try {
        const { email, password, phoneNumber, fullName } = req.body;

        if (!email || !password || !phoneNumber || !fullName) {
            return res.status(400).send({ status: 'Please fill in all required fields' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send({ status: 'User email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Initialize cart as empty array
        const newUser = new User({
            fullName,
            email,
            phoneNumber,
            password: hashedPassword,
            cart: [], // empty cart
            image: '',
            savedItems: [], // could store product IDs
            Card: '',
            is_online: true,
            is_deleted: false,
            orders: [], // references to Order documents
            timeStamp: Date.now(),
            addresses: []
        });

        await newUser.save();

        res.status(200).send({
            status: 'User created successfully',
            user: newUser
        });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send({ status: 'Internal Server Error' });
    }
});


// Login endpoint
authrouter.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ status: 'Please fill in all required fields' });
    }

    try {
        const foundUser = await User.findOne({ email });
        if (!foundUser) {
            return res.status(400).send({ status: 'User not found' });
        }

        const passwordMatch = await bcrypt.compare(password, foundUser.password);
        if (!passwordMatch) {
            return res.status(401).send({ status: 'Incorrect details' });
        }

        const token = jwt.sign({ _id: foundUser._id }, process.env.JWT_SECRET);

        foundUser.is_online = true;
        await foundUser.save();

        res.status(200).send({ status: 'Login successful', user: foundUser, token });

    } catch (error) {
        console.error(error);
        res.status(500).send({ status: 'Internal Server Error' });
    }
});

// Logout endpoint
authrouter.post('/logout', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).send({ status: 'Error', msg: 'All fields must be filled' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        await User.updateOne({ _id: decoded._id }, { is_online: false });

        res.status(200).send({ status: 'success', msg: 'success' });

    } catch (error) {
        console.error(error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).send({ status: 'error', msg: 'Token verification failed' });
        }
        res.status(500).send({ status: 'some error occurred', msg: error.message });
    }
});

module.exports = authrouter;
