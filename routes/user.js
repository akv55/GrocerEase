const express = require('express');
const router = express.Router();
const passport = require('passport');
const wrapAsync = require('../utils/wrapAsync.js');
const multer = require("multer");
const {storage,userStorage}=require("../cludeConfig.js");
const upload = multer({ storage }); // Set up multer for file uploads
const userImageStorage = multer({  userStorage }); // Set up multer for user image uploads
const { saveRedirecturl, isLogined, isUser, isNotLogined } = require('../middleware.js');
const userController = require('../controllers/user.js');
// Multer configuration for file uploads

// Signup Route - GET
router.get('/signup', wrapAsync((req, res) => {
    res.render("users/signup.ejs");
}));
// Signup Route - POST
router.post('/signup', wrapAsync(userController.userSignUp));
// Login Route - GET
router.get('/login', wrapAsync((req, res) => {
    res.render("users/login.ejs");
}));
// Login Route - POST
router.post("/login",
    saveRedirecturl,
    passport.authenticate("local",
        {
            failureRedirect: "/login",
            failureFlash: true
        }), wrapAsync(userController.userLogin));

router.get('/logout', isLogined, userController.userLogout);
// Profile Route
router.get("/profile", isLogined, wrapAsync(userController.userProfile));
router.get("/profile/edit", isLogined, wrapAsync(userController.userProfileForm));
router.post("/profile/edit", userImageStorage.single("image"), isLogined, wrapAsync(userController.userProfileEdit));
router.get("/profile/change_password", isLogined, wrapAsync(userController.userChangePassword));
router.post("/profile/update-password", isLogined, wrapAsync(userController.userChangePasswordUpdate));
router.get("/profile/address", isLogined, wrapAsync(userController.userAddress));
router.get("/profile/change-address", isLogined, wrapAsync(userController.userAddressEdit));
router.post("/profile/change-address", isLogined, wrapAsync(userController.userAddressUpdate));
// User Orders Route
router.get("/orders", isLogined, wrapAsync(userController.userOrders));
router.get("/orders/:orderId", isLogined, wrapAsync(userController.userOrderDetails));
// User Wishlist Route
router.get("/wishlist", isLogined, wrapAsync(userController.userWishlist));
// router.post("/wishlist/add", isLogined, wrapAsync(userController.addToWishlist));
// router.post("/wishlist/remove", isLogined, wrapAsync(userController.removeFromWishlist));
// User Cart Route
router.get("/cart", isLogined, wrapAsync(userController.userCart));
router.post("/cart/add/:id", isLogined, wrapAsync(userController.addToCart));
// router.post("/cart/remove", isLogined, wrapAsync(userController.removeFromCart));

module.exports = router;