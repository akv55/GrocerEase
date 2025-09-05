const express = require("express");
const passport = require("passport");
const authController = require("../controllers/auth.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { saveRedirecturl, isLogined, isUser, isNotLogined } = require('../middleware.js');

const router = express.Router();

// ---------- SIGNUP ----------
router.get("/signup", isNotLogined, (req, res) => {
  res.render("./users/signup.ejs", { title: "Sign Up" });
});
router.post("/signup", isNotLogined, wrapAsync(authController.sendOtp));
router.post("/signup/resend-otp", wrapAsync(authController.resendSignupOtp));
router.post("/signup/verify-otp", wrapAsync(authController.verifySignupOtp));

// ---------- LOGIN ----------
router.get("/login", isNotLogined, (req, res) => {
  res.render("./users/login.ejs", { title: "Login" });
});
router.post(
  "/login",
  isNotLogined,
  saveRedirecturl,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  authController.login
);

// ---------- LOGOUT ----------
router.get("/logout", authController.logout);

// ---------- FORGOT PASSWORD ----------
router.get("/forgot-password", authController.forgotPassword);
router.post("/forgot-password", wrapAsync(authController.forgotPasswordForm));
router.get("/verify-otp", authController.verifyOtpForm);
router.post("/verify-otp", wrapAsync(authController.verifyOtp));

// ---------- CHANGE PASSWORD ----------
router.get("/change-password",isLogined, authController.ChangePassword);
router.post("/change-password",isLogined, wrapAsync(authController.PasswordUpdate));

module.exports = router;
