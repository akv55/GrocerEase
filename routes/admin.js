const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const multer = require("multer");
const {storage,}=require("../config/cloudinary.js");
const upload = multer({ storage }); // Set up multer for file uploads
const { isLogined, isAdmin } = require('../middleware.js');
// Controller
const adminController = require("../controllers/admin")

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
    console.log("Multer middleware error:", err);
    if (err instanceof multer.MulterError) {
        if (err.code === 'UNEXPECTED_FIELD') {
            console.log("Unexpected field error:", err.field);
            req.flash("error", `Unexpected field: ${err.field}. Expected field name: 'image'`);
            return res.redirect("/admin/products/new-product");
        }
    }
    next(err);
};

//admin Routes
router.get("/admin/dashboard", isLogined, isAdmin, wrapAsync(adminController.admindashboard));
router.get("/admin/users", isLogined, isAdmin, wrapAsync(adminController.registerUser));
router.delete("/admin/users/:id", isLogined, isAdmin, wrapAsync(adminController.deleteUser));
router.get("/admin/users-info/:id", isLogined, isAdmin, wrapAsync(adminController.userInfo));
router.get("/admin/products", isLogined, isAdmin, wrapAsync(adminController.listingsproducts));
router.get("/admin/categories", isLogined, isAdmin, wrapAsync(adminController.categories));
router.get("/admin/products/new-product", isLogined, isAdmin, wrapAsync(adminController.newProductForm));
router.post("/admin/products/new-product", isLogined, isAdmin, upload.single("image"), handleMulterError, wrapAsync(adminController.createProduct));
router.get("/admin/products/edit/:id", isLogined, isAdmin, wrapAsync(adminController.editProductForm));
router.post("/admin/products/edit/:id", isLogined, isAdmin, upload.single("image"), handleMulterError, wrapAsync(adminController.editProduct));
router.get("/admin/orders", isLogined, isAdmin, wrapAsync(adminController.manageOrders));
router.put("/admin/orders/:id/status", isLogined, isAdmin, wrapAsync(adminController.updateOrderStatus));
module.exports = router;