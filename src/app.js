const express = require('express');
const cors = require('cors');
require('./db/mongoose')

const userRouter = require('./routers/user')
const productRouter = require('./routers/product')

const app = express()

var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }
  
app.use(cors(corsOptions));
app.use( express.json() )
app.use(userRouter)
app.use(productRouter)


module.exports = app