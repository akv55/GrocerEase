const Address = require('../models/address.js');
const User = require('../models/user.js');
const Cart = require('../models/cart.js');
const Listing = require('../models/products.js');

// User Sign Up Controller
module.exports.userSignUp = async (req, res) => {
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
        req.login(registeredUser, function (err) {
            if (err) {
                req.flash("error", "Login failed after registration");
                return res.redirect("/signup");
            }
            req.flash("success", "Registration successful!");
            return res.redirect("/");
        });
    } catch (err) {
        req.flash("error", err.message);
        return res.redirect("/signup");
    }
};

module.exports.userLogin = async (req, res) => {
    if (req.user.role === "admin") {
        req.flash("success", "Welcome to the admin dashboard!");
        return res.redirect('/admin/dashboard');
    }
    req.flash("success", "Welcome To GrocerEase!");
    return res.redirect('/');
};

module.exports.userLogout = (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.flash("success", "Logged out successfully!");
        return res.redirect('/');
    });
};

// User Profile Controller
module.exports.userProfile = async (req, res) => {
    res.render("./users/profile.ejs", { user: req.user });
};

module.exports.userProfileEdit = async (req, res) => {
    res.render("./users/profile-edit.ejs", { user: req.user });
};

module.exports.userProfileEditPost = async (req, res) => {
    const { name, email, phone } = req.body;

    if (name && name.trim()) req.user.name = name.trim();
    if (email && email.trim()) req.user.email = email.trim().toLowerCase();
    if (phone && phone.trim()) req.user.phone = phone.trim();

    if (req.file) {
        req.user.profileImage = {
            filename: req.file.filename,
            url: `/uploads/profiles/${req.file.filename}`
        };
        req.user.markModified('profileImage');
    }

    await req.user.save();
    req.flash("success", "Profile updated successfully");
    return res.redirect("/profile");
};

// Change Password Controller (✅ Fixed version)
module.exports.userChangePassword = async (req, res) => {
    res.render("./users/changePassword.ejs", { user: req.user });
};

module.exports.userChangePasswordUpdate = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        req.flash("error", "All password fields are required");
        return res.redirect("/settings");
    }

    if (newPassword !== confirmPassword) {
        req.flash("error", "New password and confirm password do not match");
        return res.redirect("/settings");
    }

    try {
        const result = await req.user.authenticate(currentPassword);
        if (!result.user) {
            req.flash("error", "Current password is incorrect");
            return res.redirect("/settings");
        }

        await req.user.setPassword(newPassword);
        await req.user.save();

        req.flash("success", "Password changed successfully");
        return res.redirect("/profile");
    } catch (err) {
        req.flash("error", "Something went wrong while changing password");
        return res.redirect("/settings");
    }
};

// User Address Controller
module.exports.userAddress = async (req, res) => {
    const userAddress = await Address.findOne({ userId: req.user._id });
    res.render("./users/address.ejs", { user: req.user, address: userAddress });
};

module.exports.userAddressEdit = async (req, res) => {
    const userAddress = await Address.findOne({ userId: req.user._id });
    res.render("./users/updateAddress.ejs", { user: req.user, address: userAddress });
};

module.exports.userAddressUpdate = async (req, res) => {
    const { street, landmark, city, state, country, zip, isDefault } = req.body;

    if (isDefault === 'on') {
        await Address.updateMany({ userId: req.user._id }, { isDefault: false });
    }

    let existingAddress = await Address.findOne({ userId: req.user._id });

    if (existingAddress) {
        existingAddress.address.street = street.trim();
        existingAddress.address.landmark = landmark.trim();
        existingAddress.address.city = city.trim();
        existingAddress.address.state = state.trim();
        existingAddress.address.country = country.trim();
        existingAddress.address.pincode = zip.trim();
        existingAddress.address.isDefault = isDefault === 'on';
        await existingAddress.save();
    } else {
        await Address.create({
            userId: req.user._id,
            address: {
                street: street.trim(),
                landmark: landmark.trim(),
                city: city.trim(),
                state: state.trim(),
                country: country.trim(),
                pincode: zip.trim(),
                isDefault: isDefault === 'on'
            }
        });
    }

    req.flash("success", "Address updated successfully");
    return res.redirect("/profile/address");
};

// User Order Route
module.exports.userOrders = async (req, res) => {
    res.render("./users/orders.ejs");
};

// User Order Details
module.exports.userOrderDetails = async (req, res) => {
    const { orderId } = req.params;
    res.render("./users/orders.ejs", { orderId });
};

// User Wishlist
module.exports.userWishlist = async (req, res) => {
    res.render("./users/wishlist.ejs");
};

// User Cart Controller
module.exports.userCart = async (req, res) => {
    const cart = await Listing.findById(req.params.id);
    const userAddress = await Address.findOne({ userId: req.user._id });
    res.render("./listing/carts.ejs", { cart, user: req.user, address: userAddress });
};
