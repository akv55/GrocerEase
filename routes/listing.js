const express = require('express');
const wrapAsync = require('../utils/wrapAsync');
const Listing = require('../models/products.js');
const router = express.Router();
// Controller

const listingcontroller=require("../controllers/listings")

const validatelisting = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map(el => el.message).join(',');
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}
// Index Routes 
router.get("/", wrapAsync(listingcontroller.index));

// Show Routes 
router.get("/:slug", wrapAsync(listingcontroller.show));

module.exports = router;