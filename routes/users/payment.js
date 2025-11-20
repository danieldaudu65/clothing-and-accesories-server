const express = require('express');
const Payment = require('../modal/payment');
const user = require('../modal/user');
const { sendSuccessMessage } = require('../utils/nodemailer');
const crypto = require("crypto");

// Create new payment
const router = express.Router();





router.get("/use_token/:token", async (req, res) => {
    const { token } = req.params;

    const payment = await Payment.findOne({ token });

    if (!payment) return res.status(404).send("Invalid link");
    if (payment.tokenUsed) return res.status(400).send("Link already used");
    if (payment.expiresAt < new Date()) return res.status(400).send("Link expired");


    payment.tokenUsed = true;
    await payment.save();

    // redirect user to the actual booking link stored in DB
    if (payment.bookingLink) {
        return res.redirect(payment.bookingLink);
    } else {
        return res.status(400).send("No booking link found for this payment.");
    }
});




router.post('/create_payment', async (req, res) => {
    try {
        let { name, email, is_call_payment, username, product_id, product_title, product_price } = req.body;

        if (!name || !email || is_call_payment === undefined || !username || !product_id || !product_title || !product_price) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // ✅ Lowercase and trim the username
        username = username.toLowerCase().trim();

        // ✅ Check if the Twitter handle already exists in Users
        // const existingUser = await user.findOne({ twitterHandle: username });
        // if (existingUser) {
        //     return res.status(400).json({ message: 'This Twitter handle is already registered.' });
        // }

        // Booking link logic for call payments
        let bookingLink = "";
        if (is_call_payment && product_title.includes("30")) {
            bookingLink = "https://calendly.com/block-hub-mailer/30min";
        } else if (is_call_payment && product_title.includes("45")) {
            bookingLink = "https://calendly.com/block-hub-mailer/new-meeting";
        }

        const payment = new Payment({
            name,
            email,
            username,
            product_id,
            is_call_payment,
            product_title,
            product_price,
            bookingLink,
            status: false
        });

        await payment.save();

        res.status(201).json({
            message: 'Payment record created successfully',
            data: payment
        });
    } catch (error) {
        console.error('Payment creation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/mark_as_paid', async (req, res) => {
    try {
        const { name, paymentId } = req.body;

        // 1️⃣ Find and mark payment as paid
        const payment = await Payment.findOneAndUpdate(
            { _id: paymentId },
            { status: true },
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ message: 'Payment record not found.' });
        }

        // 2️⃣ Find user by twitterHandle (username in payment)
        let Iuser = await user.findOne({ twitterHandle: payment.username });

        if (Iuser) {
            // ✅ Mark template as bought
            Iuser.template_bought = true;

            // Optional: update handle if not already correct
            if (payment.username && Iuser.twitterHandle !== payment.username) {
                Iuser.twitterHandle = payment.username;
            }

            await Iuser.save();
        } else {
            console.warn(`⚠️ No user found with handle ${payment.username}`);
        }

        // 3️⃣ Decide link to send
        let linkToSend;
        if (payment.is_call_payment) {
            const token = crypto.randomBytes(24).toString("hex");
            payment.token = token;
            payment.tokenUsed = false;
            payment.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await payment.save();

            linkToSend = `https://blockhub-server.onrender.com/user_payment/use_token/${token}`;
        } else if (payment.product_id === "kit_9f3a7c1b82d4") {
            linkToSend = "https://chat.whatsapp.com/HMKMLZpcDoU7K5kfl9ABy7";
        } else {
            linkToSend = "https://chat.whatsapp.com/DZGDVVInnjc1M1nQsfgh7y";
        }

        // 4️⃣ Send success email
        await sendSuccessMessage(payment.email, name, linkToSend);

        return res.status(200).json({
            message: 'Payment marked as paid, user updated, email sent',
            payment,
            user: Iuser
        });

    } catch (err) {
        console.error("❌ Error in mark_as_paid:", err);
        res.status(500).json({ message: 'Server error' });
    }
});


// module.exports = /;


module.exports = router;