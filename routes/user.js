const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const passport = require('passport');



// Signup Route - GET
router.get('/signup', (req, res) => {
    res.render("users/signup.ejs");
});

// Signup Route - POST
router.post('/signup', async (req, res) => {
    try {
        let { name, password, email, phone, role } = req.body;
        const newUser = new User({
            username: email,
            email,
            phone,
            name,
            role
        });
        const registeredUser = await User.register(newUser, password);

        res.redirect("/listings");
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
});

// Login Route - GET
router.get('/login', (req, res) => {
    res.render("users/login.ejs");
});

// Login Route - POST
router.post("/login",
    passport.authenticate("local",
        {
            failureRedirect: "/login",
            failureFlash: true
        }),
    async (req, res) => {
        if (req.user.role === "admin") {
            req.flash("success", "Welcome to the admin dashboard!");
            return res.redirect('/admin/dashboard');
        }
        req.flash("success", "Welcome  To GrocerEase!");
        res.redirect('/listings');
    });

router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            next(err);
        }
        req.flash("success", "Logged out successfully!");
        res.redirect('/listings');
    })
});
module.exports = router;