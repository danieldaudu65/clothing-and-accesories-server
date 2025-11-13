const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path')

const newMember = require('../model/user');
const { encryptObject, decryptObject } = require('../ecrypt');
require('dotenv').config();
const multer = require('multer');


// Endpoint to upload profile picture and update user image URL
router.post('/upload-profile-pic', upload.single('profile_pic'), async (req, res) => {
    try {
        const token = req.headers['auth-token'];
        if (!token) return res.status(401).json({ message: 'Authentication token missing' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const image_url = `http://localhost:${port}/images/${req.file.filename}`;
        await user.findByIdAndUpdate(userId, { image: image_url });

        res.json({
            success: 1,
            image_url: image_url
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/get-user-account-details', async (req, res) => {
    const token = req.header("auth-token")

    if (!token) {
        return res.status(400).send({ Statsu: 'Please Provide a Token' })
    }
    try {
        // Token verification
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //  find user by id
        const user = await newMember.findById(decoded._id)
        if (!user) {
            return res.status(404).send({ Status: 'User Not Found' });
        } 

        // Send user details with masked password
        res.status(200).send(user);
    }
    catch {
        console.error(error);
        res.status(500).send({ status: 'Internal Server Error' });
    }
})
router.get('/get-user-address-details', async (req, res) => {
    const token = req.header('auth-token');

    // Check if token is valid
    if (!token) {
        return res.status(400).send('Please Provide a Valid Token');
    }

    try {
        // Token verification
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by id
        const user = await newMember.findById(decoded._id);
        if (!user) {
            return res.status(404).send({ status: 'User Not Found' });
        }

        // Send the last address in the array
        const lastAddress = user.addresses && user.addresses.length > 0
            ? user.addresses[user.addresses.length - 1]
            : null;

        res.status(200).send(lastAddress);
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: 'Internal Server Error' });
    }
});

router.post('/add-card', async (req, res) => {
    const { Card } = req.body;
    const token = req.header('auth-token');

    if (!token || !Card) {
        return res.status(400).send({ status: 'error', msg: 'Please fill in all details' });
    }
    try {
        // Token verification
        const user = jwt.verify(token, process.env.JWT_SECRET);



        // Fetch initial user card details and decrypt if any
        const userM = await newMember.findById({ _id: user._id }, { Card: 1 }).lean();
        if (userM.Card) {
            // Decrypt card details
            let decrypted_Card = decryptObject(userM.Card, process.env.CRIPTO_DIGIT);
            decrypted_Card.push(Card);

            // Encrypt card details and update the user document
            const encrypted_Card = encryptObject(decrypted_Card, process.env.CRIPTO_DIGIT);
            await newMember.updateOne({ _id: user._id }, { Card: encrypted_Card });

            return res.status(200).send({ status: 'ok', msg: 'Success', Card: decrypted_Card, userM });
        }

        // Encrypt card details and update the user document
        const encrypted_Card = encryptObject([Card], process.env.CRIPTO_DIGIT);
        await newMember.updateOne({ _id: user._id }, { Card: encrypted_Card });

        return res.status(200).send({ status: 'ok', msg: 'Success', Card: [Card], });
    } catch (e) {
        console.error(e);
        if (e.name === 'JsonWebTokenError') {
            return res.status(401).send({ status: 'error', msg: 'Token verification failed' });
        }
        return res.status(500).send({ status: 'error', msg: 'An error occurred' });
    }
});

router.get("/view_card", async (req, res) => {
    const token = req.header('auth-token');

    if (!token) {
        return res.status(400).send({ status: "error", msg: "required fields must be filled" });
    }

    try {
        // token verification
        const user = jwt.verify(token, process.env.JWT_SECRET);

        // fetch initial user card details
        const { Card } = await newMember.findById({ _id: user._id }, { Card: 1 }).lean();

        // check if user has card details
        if (!Card)
            return res.status(200).send({ status: "ok", msg: "no card details for this user", count: 0 });

        // decrypt card details
        let decrypted_Card = decryptObject(Card, process.env.CRIPTO_DIGIT);

        return res.status(200).send({ status: "ok", msg: "success", Card: decrypted_Card, count: decrypted_Card.length });

    } catch (e) {
        console.error(e);
        if (e.name === 'JsonWebTokenError')
            return res.status(401).send({ status: "error", msg: "Token verification failed" });

        return res.status(500).send({ status: "error", msg: "An error occured" });
    }
});

router.delete('/delete-user-account', async (req, res) => {
    const token = req.header('auth-token');

    // Check if token is valid
    if (!token) {
        return res.status(400).send('Please provide a valid token');
    }

    try {
        // Token verification
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user by id and delete
        const user = await newMember.findByIdAndDelete(decoded._id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        return res.status(200).send({ status: 'success', msg: 'User account deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).send('An error occurred');
    }
});

router.post('/save-item', async (req, res) => {
    const token = req.header('auth-token');
    const { itemId } = req.body;

    if (!token || !itemId) {
        return res.status(400).send({ status: 'Please provide a valid token and item ID' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await newMember.findById(decoded._id);

        if (!user) {
            return res.status(404).send({ status: 'User not found' });
        }

        if (!user.savedItems) {
            user.savedItems = [];
        }

        user.savedItems.push(itemId);
        await user.save();

        console.log(user.savedItems);
        res.status(200).send({ status: 'success', savedItem: itemId, user });

    } catch (error) {
        console.error(error);
        res.status(500).send({ status: 'Internal Server Error' });
    }
});

router.get('/saved-items', async (req, res) => {
    const token = req.header('auth-token');

    if (!token) return res.status(401).send({ status: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await newMember.findById(decoded._id);

        if (!user) {
            return res.status(404).send({ status: 'User not found' });
        }

        res.status(200).send({ savedItems: user.savedItems });
    } catch (error) {
        console.error('Error fetching saved items:', error);
        res.status(500).send({ status: 'Internal Server Error' });
    }
}); 


router.post('/removefrom-saveditems', async (req, res) => {
    const token = req.headers['auth-token'];
    const { itemId } = req.body;

    if (!token || !itemId) {
        return res.status(400).send({ status: 'Please provide a valid token and item ID' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await newMember.findById(decoded._id);

        if (!user) {
            return res.status(404).send({ status: 'User not found' });
        }

        // Check if item exists in savedItems
        const itemIndex = user.savedItems.indexOf(itemId);

        if (itemIndex === -1) {
            return res.status(404).send({ status: 'Item not found in saved items' });
        }

        // Remove item from savedItems
        user.savedItems.splice(itemIndex, 1);

        await user.save();

        res.status(200).send({ status: 'success', message: 'Item removed from saved items', savedItems: user.savedItems });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: 'Internal Server Error' });
    }
});



module.exports = router;
