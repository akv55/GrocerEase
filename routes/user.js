const express = require('express');
const router = express.Router();
const passport = require('passport');
const wrapAsync = require('../utils/wrapAsync.js');
const multer = require('multer');
const { saveRedirecturl, isLogined, isUser, isNotLogined } = require('../middleware.js');
const userController = require('../controllers/user.js');
// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/profiles/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });
// Signup Route - GET
router.get('/signup', isNotLogined, wrapAsync((req, res) => {
    res.render("users/signup.ejs");
}));
// Signup Route - POST
router.post('/signup', isNotLogined, wrapAsync(userController.userSignUp));
// Login Route - GET
router.get('/login', isNotLogined, wrapAsync((req, res) => {
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
router.get("/profile/edit", isLogined, wrapAsync(userController.userProfileEdit));
router.post("/profile/edit", upload.single('profileImage'), isLogined, wrapAsync(userController.userProfileEditPost));
router.get("/profile/change_password", isLogined, wrapAsync(userController.userChangePassword));
router.post("/profile/change-password", isLogined, wrapAsync(userController.userChangePasswordUpdate));
router.get("/profile/address", isLogined, wrapAsync(userController.userAddress));
router.get("/profile/change-address", isLogined, wrapAsync(userController.userAddressEdit));
router.post("/profile/change-address", isLogined, wrapAsync(userController.userAddressUpdate));
// User Orders Route
router.get("/orders", isLogined, wrapAsync(userController.userOrders));
router.get("/orders/:orderId", isLogined, wrapAsync(userController.userOrderDetails));
// User Wishlist Route
router.get("/wishlist", isLogined, wrapAsync((req, res) => {
    res.render("users/wishlist.ejs");
}));

module.exports = router;