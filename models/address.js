const mongoose = require('mongoose')

const userAddressBook = new mongoose.Schema({
    fullName: {
        type: String,
        required: true  
    },
    phoneNumber: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        require: true
    },
    city: {
        type: String,
        require: true
    },
    state: {
        type: String,
        require: true
    }
},{collection: 'addressBook'})

module.exports = mongoose.model('addressbook', userAddressBook)