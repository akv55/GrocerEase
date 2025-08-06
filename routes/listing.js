const express = require('express');
const wrapAsync = require('../utils/wrapAsync');
const router = express.Router();
const { isLogined, isUser, isAdmin } = require('../middleware.js');

// Controller
const listingcontroller=require("../controllers/listings")
// Index Routes 
router.get("/", wrapAsync(listingcontroller.index));
// Show Routes 
router.get("/:slug", wrapAsync(listingcontroller.showIndex));
// Delete Routes
router.delete("/admin/products/:id", isLogined, isAdmin, wrapAsync(listingcontroller.deleteListing));

module.exports = router;