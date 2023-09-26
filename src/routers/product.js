const express = require("express");
const router = new express.Router();
const auth = require("../middleware/auth");
const Product = require("../model/product");

// POST create a product
router.post('/products',auth, async (req, res) => {
    
    const product = new Product( { ...req.body } )
    try{
        await product.save()
        res.status(201).send( product )
    }
    catch (err){
        res.status(400).send(err)
    }
})

// GET all product or only one if _id is provided via query
router.get('/products',auth, async (req, res)=>{

    const match = {};

    try {

        if( req.query._id){
            match._id = req.query._id;
        }
        // main products, only for purchase 
        if( req.query.main ){
            match.main_product = req.query.main;
        }
        const products = await Product.find(match);
        res.status(200).send(products);

    }
    catch (e){
        res.status(500).send();
    }

 })

module.exports = router