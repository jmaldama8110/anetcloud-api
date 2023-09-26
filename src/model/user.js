const mongoose = require('mongoose')
const validador = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const axios = require('axios');
const url = require('url');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    lastname: {
        type: String,
        trim: true,
        required: true
    },
    email:{
        type: String,
        unique: true,
        required: true,
        trim: true,
        validate(value){
            if( ! (validador.isEmail(value)) ){
                throw new Error('Correo electronico no valido..')
            }   
        }
    },
    password:{
        type: String,
        trim: true
    },
    cart: {
        product: {
            short_name: { type: String},
            description: { type: String},
            product_type: { type: String },
            quantity: { type: Number},
            price: { type: String},
            paypal_product_id: { type: String },
            paypal_plan_id: { type: String },
            subproducts: [{}]
        },
        company: {
            name: { type: String},
            rfc: { type: String},
            address1: { type: String},
            address2: { type: String},
            city: { type: String},
            cp: { type: String},
            province: { type: String},
            country: { type: String}
        },
        contact: {
            name: { type: String },
            lastname: { type: String },
            email: { type: String },
            phone: { type: String }
        },
        summary: {
            items: { type: Number },
            subtotal: { type: String },
            tax: { type: String },
            total: {type: String}      
        }
    },
    selfi:{
        type: Buffer,
        required: false
    },
    tokens: [{
            token:{
                type: String,
                required: true
            },
            paypal_token: {
                type: String,
                required: true
            }
        }]

},
{ timestamps: true } )


userSchema.methods.generateAuthToken = async function () {
    const user = this

    /// adds 5 hours of token expiration
    const expires_at = new Date();
    expires_at.setHours( expires_at.getHours() + 5);
    ///////////

    const jwt_secret_key = process.env.JWT_SECRET_KEY
    const token  = jwt.sign(    {   _id : user._id.toString(), expires_at } , jwt_secret_key)

    /// Paypal Access Token
    const api = axios.create({
        method: 'post',
        url:'/v1/oauth2/token',
        baseURL: process.env.PAYPAL_URL,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_SECRET_KEY
        },
    })
    const params = new url.URLSearchParams({ grant_type: 'client_credentials' });
    const paypalRes = await api.post('/v1/oauth2/token',params);
    const paypal_token = paypalRes.data.access_token;
    ////////

    user.tokens = user.tokens.concat( { token, paypal_token  } )
    await user.save()

    return token
}

userSchema.methods.toJSON = function(){
    const user = this

    const userPublic = user.toObject()
    
    delete userPublic._id;
    delete userPublic.password
    delete userPublic.tokens
    delete userPublic.selfi

    return userPublic

    
}

userSchema.statics.findUserByCredentials = async ( email, password ) => {
    
    const user = await User.findOne( {email} )

    if( !user ){
        throw new Error('No puede logearse...')
    }

    const isMatch = await bcrypt.compare( password, user.password )

    if( !isMatch ){
        throw new Error ('No puede logearse...')
    }

    return user
}

const User = mongoose.model('User',userSchema )

module.exports = User