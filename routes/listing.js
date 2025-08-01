const express = require('express');
const wrapAsync = require('../utils/wrapAsync');
const router = express.Router();
const { isLogined, isUser } = require('../middleware.js');

// Controller
const listingcontroller=require("../controllers/listings")
// Index Routes 
router.get("/", wrapAsync(listingcontroller.index));
// Show Routes 
router.get("/:slug", wrapAsync(listingcontroller.showIndex));

module.exports = router;