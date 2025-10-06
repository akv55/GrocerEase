const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const multer = require("multer");
const {storage,}=require("../config/cloudinary.js");
const upload = multer({ storage }); 
const { isLogined} = require('../middleware.js');
const userController = require('../controllers/user.js');

// Profile Route
router.get("/profile", isLogined, wrapAsync(userController.Profile));
router.get("/profile-edit", isLogined, wrapAsync(userController.ProfileForm));
router.post("/profile-edit", upload.single("profileImage"), isLogined, wrapAsync(userController.ProfileEdit));
router.get("/user-address", isLogined, wrapAsync(userController.Address));
router.get("/user-address/edit", isLogined, wrapAsync(userController.AddressEditForm));
router.post("/user-address/edit", isLogined, wrapAsync(userController.AddressUpdate));
// User Orders Route
router.get("/my-orders/:id", isLogined, wrapAsync(userController.Orders));
router.get("/my-orders/:id/:orderId", isLogined, wrapAsync(userController.OrderDetails));
// Review Routes
router.get("/review/:productId", isLogined, wrapAsync(userController.ReviewForm));
router.post("/review/:productId", isLogined, wrapAsync(userController.SubmitReview));
// Checkout Routes
router.get("/checkout", isLogined, wrapAsync(userController.checkoutForm));
router.post("/checkout", isLogined, wrapAsync(userController.checkoutProcess));
// User Wishlist Route
router.get("/wishlist", isLogined, wrapAsync(userController.Wishlist));
router.post("/wishlist/add/:id", isLogined, wrapAsync(userController.addToWishlist));
router.post("/wishlist/remove/:id", isLogined, wrapAsync(userController.removeFromWishlist));
// User Cart Route
router.get("/cart", isLogined, wrapAsync(userController.Cart));
router.post("/cart/add/:id", isLogined, wrapAsync(userController.addToCart));
router.post("/cart/remove/:id", isLogined, wrapAsync(userController.removeFromCart));
//payment
router.get("/users/:id/payment", isLogined, wrapAsync(userController.paymentForm));
router.post("/users/:id/payment", isLogined, wrapAsync(userController.processPayment));

module.exports = router;