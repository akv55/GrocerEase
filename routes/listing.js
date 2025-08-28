const express = require('express');
const wrapAsync = require('../utils/wrapAsync');
const router = express.Router();
const category = require('../models/category.js');
// Controller
const listingcontroller=require("../controllers/listings")
// Index Routes 
router.get("/", wrapAsync(listingcontroller.index));
// Search Routes - Must come before /:slug to avoid conflicts
router.get("/search", wrapAsync(listingcontroller.searchListings));
// Products route with category filter
router.get("/products", wrapAsync(listingcontroller.filterByCategory));
// Show Routes 
router.get("/:slug", wrapAsync(listingcontroller.showIndex));
module.exports = router;