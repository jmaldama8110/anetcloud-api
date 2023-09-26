const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    user_id: {},
    cart: {},
    plan: {},
    subscription: {}

}, { timestamps: true })

const Order = mongoose.model('Order', orderSchema)

module.exports = Order