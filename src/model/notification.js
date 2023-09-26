const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
   data: {}
}, { timestamps: true })

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification