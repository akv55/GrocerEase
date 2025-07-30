const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const { isLogined, isAdmin } = require('../middleware.js');
// Controller
const adminController = require("../controllers/admin")

//admin Routes
router.get("/admin/dashboard", isLogined, isAdmin, wrapAsync(adminController.admindashboard));
router.get("/admin/users", isLogined, isAdmin, wrapAsync(adminController.registerUser));
router.get("/admin/products", isLogined, isAdmin, wrapAsync(adminController.listingsproducts));
module.exports = router;