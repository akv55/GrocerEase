const express = require('express');
const router = express.Router();
const passport = require('passport');
const wrapAsync = require('../utils/wrapAsync.js');
const { saveRedirecturl, isLogined, isUser, isNotLogined } = require('../middleware.js');
const authController = require('../controllers/auth.js');

// Signup Route - GET
router.get('/signup', isNotLogined, wrapAsync((req, res) => {
    res.render("users/signup.ejs",{title:"Sign Up"});
}));

// Send OTP for signup
router.post("/send-otp", isNotLogined, wrapAsync(authController.sendOtp));

// Resend OTP for signup
router.post("/resend-signup-otp", isNotLogined, wrapAsync(authController.resendSignupOtp));

// Verify signup OTP and complete registration
router.post("/verify-signup-otp", isNotLogined, wrapAsync(authController.verifySignupOtp));

// Direct signup (fallback)
router.post('/signup', isNotLogined, wrapAsync(authController.signUp));
// Login Route - GET
router.get('/login', isNotLogined, wrapAsync((req, res) => {
    res.render("users/login.ejs",{title:"Login"});
}));
// Login Route - POST
router.post("/login",
    isNotLogined,
    saveRedirecturl,
    passport.authenticate("local",
        {
            failureRedirect: "/login",
            failureFlash: true
        }), wrapAsync(authController.login));

router.get('/logout', isLogined, authController.logout);
// Forget Password Route
router.get("/forgot-password", isNotLogined, wrapAsync(authController.forgotPassword));
router.post("/forgot-password", isNotLogined, wrapAsync(authController.forgotPasswordForm));
router.get("/verify-otp", isNotLogined, wrapAsync(authController.verifyOtpForm));
router.post("/verify-otp", isNotLogined, wrapAsync(authController.verifyOtp));
router.get("/change-password", isLogined, wrapAsync(authController.ChangePassword));
router.post("/change-password", isLogined, wrapAsync(authController.UpdatePassword));
module.exports = router;

