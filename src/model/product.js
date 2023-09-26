const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    _id:{},
    short_name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    price: {
        type: String,
        required: true
    },
    main_product: {
        type: Boolean,
        required: true,
        defualt: false
    },
    paypal_product_id: {
        type: String,
        required: false
    },
    subproducts: [{}],
    show: {
        type: Boolean,
        default: false
    },
    active: {
        type: Boolean,
        default: true
    }

}, { timestamps: false })


const Product = mongoose.model('Product', productSchema)

module.exports = Product