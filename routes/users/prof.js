const express = require('express');
const newMemberSchema = require('../model/user');
const router = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

router.post('/change-password', async (req, res) => {
    const { password, newPassword, confirmPassword } = req.body;

    if (!password || !newPassword || !confirmPassword) {
        return res.status(400).send({ status: 'Please type in your password' });
    }

    try {
        const user = await newMemberSchema.findOne({ password });
        if (!user) {
            return res.status(404).send({ status: 'Password Incorrect' });
        }
        const comparePassword = await bcrypt.compare(password, user.password);

        if (!comparePassword) {
            return res.status(404).send({ status: 'Password Incorrect' });
        }

        const hashPassword = await bcrypt.hash(newPassword, 10);

        await newMemberSchema.findByIdAndUpdate(user._id, { password: hashPassword });
        return res.status(200).send({ status: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: 'Internal Server Error' });
    }
});

router.post('/add-address', async (req, res) => {
    const { name, number, address, city, state } = req.body;
    const token = req.header('auth-token');
    console.log('Received token:', token); 

    if (!name || !number || !address || !city || !state || !token) {
        return res.status(400).send({ status: "error", msg: "all fields must be filled" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);

        const user = await newMemberSchema.findOne({ _id: decoded._id });
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        user.addresses.push({ name, number, address, city, state });

        await user.save();
        const newToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

        res.status(200).send({ message: 'Address added successfully', user: user, Token: newToken });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).send({ error: error.message || 'Internal server error' });
    }
});

router.get('/get-address', async (req, res) => {
    const token = req.header('auth-token');
    console.log('Received token:', token); 

    if (!token) {
        return res.status(401).send({ error: 'Authentication token not found' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await newMemberSchema.findOne({ _id: decoded._id });

        const userAddress = user.addresses;

        res.status(200).send({ userAddress });
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).send({ error: 'Invalid token' });
    }
});

module.exports = router;
