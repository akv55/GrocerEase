const mongoose = require('mongoose');
const Address = require('../models/address.js');
const User = require('../models/user.js');
const Cart = require('../models/cart.js');
const Listing = require('../models/products.js');
const Wishlist = require('../models/wishlist.js');
const crypto = require('crypto');
const transporter = require('../config/email.js');

// OTP storage (in production, use Redis or similar)
let otpStore = {};

// User Sign Up Controller
module.exports.userSignUp = async (req, res) => {
    try {
        const exitEmail = await User.findOne({ email: req.body.email });
        if (exitEmail) {
            req.flash("error", "Email already exists. Please try another.");
            return res.redirect("/signup");
        }
        const exitPhone = await User.findOne({ phone: req.body.phone });
        if (exitPhone) {
            req.flash("error", "Phone number already exists. Please try another.");
            return res.redirect("/signup");
        }

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

// ---------------------FORGOT PASSWORD------------------

module.exports.forgotPassword = (req, res) => {
    res.render("./users/forgotPassword.ejs");
};


module.exports.forgotPasswordForm = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/forgot-password");
    }
    const otp = crypto.randomInt(100000, 999999);
    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };
    try {
        await transporter.sendMail({
            from: `"GroceEase" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "GroceEase - OTP Verification",
            html: `
                <div style="font-family: Arial, sans-serif; padding:20px;">
                    <h2 style="color:#28a728;">GroceEase - OTP Verification</h2>
                    <p>Hello,</p>
                    <p>Your One-Time Password (OTP) is: <b>${otp}</b></p>
                    <p>This OTP is valid for <b>5 minutes</b>. Please do not share it with anyone.</p>
                    <p>Thank you,<br>Team GroceEase</p>
                </div>
                <div style="font-size: 12px; color: #888;">
                    <p>If you did not request this OTP, please ignore this email.</p>
                </div>
            `
        });
        req.flash("success", "OTP sent to your email.");
        res.redirect("/verify-otp");
    } catch (error) {
        req.flash("error", "Error sending OTP email:", error);
    }
};
module.exports.verifyOtpForm = (req, res) => {
    res.render("./users/verify-otp.ejs")
}
module.exports.verifyOtp = async (req, res) => {
    const { email } = req.body;
    // Collect OTP digits from six inputs (otp[0], otp[1], ..., otp[5])
    const otpInputs = req.body.otp; // should be an array from your form
    const otp = otpInputs.join(""); // combine into a single string
    if (!otpStore[email]) {
        req.flash("error", "Invalid or expired OTP");
        return res.redirect("/verify-otp");
    }
    const { expires } = otpStore[email];
    if (Date.now() > expires) {
        delete otpStore[email];
        req.flash("error", "OTP expired");
        return res.redirect("/verify-otp");
    }
    if (otp !== otpStore[email].otp) {
        req.flash("error", "Invalid OTP");
        return res.redirect("/verify-otp");
    }

    // Success
    delete otpStore[email];
    req.flash("success", "OTP verified successfully");
    return res.redirect("/login"); // change route as per your flow
};


// User Profile Controller
module.exports.userProfile = async (req, res) => {
    res.render("./users/profile.ejs", { user: req.user });
};

module.exports.userProfileForm = async (req, res) => {
    res.render("./users/profileUpdate.ejs", { user: req.user });
};

module.exports.userProfileEdit = async (req, res) => {
    const { id } = req.params;
    const { user } = req.body;
    try {
        const updateProfile = await User.findByIdAndUpdate(id, {
            name: user.name,
            email: user.email,
            phone: user.phone
        }, { new: true });
        if (req.file) {
            updateProfile.image = {
                filename: req.file.filename,
                url: req.file.path
            };
            await updateProfile.save();
        }
    } catch (err) {
        req.flash("error", "Failed to update profile. Please try again.");
        return next(err);
    }
    req.flash("success", "Profile updated successfully");
    return res.redirect("/profile");
};


module.exports.userChangePassword = async (req, res) => {
    res.render("./users/changePassword.ejs", { user: req.user });
};

module.exports.userPasswordUpdate = async (req, res) => {
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


// ----------------------------------User Wishlist----------------------------
module.exports.userWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id }).populate("products");
        res.render("./users/wishlist.ejs", {
            user: req.user,
            wishlistItems: wishlist ? wishlist.products : []
        });
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        req.flash("error", "Unable to load wishlist");
    }
};


module.exports.addToWishlist = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user._id;
        const product = await Listing.findById(productId);

        if (!product) {
            req.flash("error", "Product not found");
            return res.redirect("back");
        }

        let wishlist = await Wishlist.findOne({ user: userId });

        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, products: [] });
        }
        // Convert productId to ObjectId
        const objectId = new mongoose.Types.ObjectId(productId);
        // Check if already exists
        if (!wishlist.products.some(p => p.equals(objectId))) {
            wishlist.products.push(objectId);
            await wishlist.save();
            req.flash("success", "Product added to wishlist");
        } else {
            req.flash("success", "Product already in wishlist");
        }

        return res.redirect("back");
    } catch (error) {
        req.flash("error", "Error adding product to wishlist");
        return res.redirect("back");
    }
};


module.exports.removeFromWishlist = async (req, res) => {
    const productId = req.params.id;
    const userId = req.user._id;

    try {
        const wishlist = await Wishlist.findOne({ user: userId });

        if (wishlist) {
            wishlist.products = wishlist.products.filter(id => !id.equals(productId));
            await wishlist.save();
            req.flash("success", "Product removed from wishlist");
        }

        res.redirect("back");
    } catch (error) {
        console.error(error);
        req.flash("error", "Error removing product from wishlist");
        res.redirect("back");
    }
};




// ----------------------------------------User Cart Controller--------------------
module.exports.userCart = async (req, res) => {
    const cartItem = await Cart.findOne({ user_id: req.user._id }).populate('items.product_id');
    let totalPrice = 0;
    let totalItems = 0;

    if (cartItem && cartItem.items) {
        // Filter out items with null product_id (deleted products)
        cartItem.items = cartItem.items.filter(item => item.product_id !== null);

        cartItem.items.forEach(item => {
            if (item.product_id && item.product_id.price) {
                totalPrice += item.product_id.price * item.quantity;
                totalItems += item.quantity;
            }
        });

        // Save the cart after filtering out invalid items
        if (cartItem.isModified()) {
            await cartItem.save();
        }
    }

    const userAddress = await Address.findOne({ userId: req.user._id });
    res.render("./listing/carts.ejs", { cartItem, user: req.user, address: userAddress, totalPrice, totalItems });
};

module.exports.addToCart = async (req, res) => {
    const productId = req.params.id;
    const product = await Listing.findById(productId);
    let cartItem = await Cart.findOne({ user_id: req.user._id });

    if (!product) {
        req.flash("error", "Product not found");
        return res.redirect("/cart");
    }

    // Create a new cart if it doesn't exist
    if (!cartItem) {
        cartItem = new Cart({
            user_id: req.user._id,
            items: [],
            totalPrice: 0,
            totalItems: 0
        });
    }

    const existingItem = cartItem.items.find(item => item.product_id.equals(product._id));
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItem.items.push({ product_id: product._id, quantity: 1 });
    }

    cartItem.totalPrice += product.price;
    cartItem.totalItems += 1;
    await cartItem.save();

    req.flash("success", "Product added to cart");
    return res.redirect("/cart");
};

module.exports.removeFromCart = async (req, res) => {
    const productId = req.params.id;
    const product = await Listing.findById(productId);
    if (!product) {
        req.flash("error", "Product not found");
        return res.redirect("/cart");
    }
    let cartItem = await Cart.findOne({ user_id: req.user._id });
    if (!cartItem) {
        req.flash("error", "Cart not found");
        return res.redirect("/cart");
    }
    const existingItemIndex = cartItem.items.findIndex(item => item.product_id.equals(product._id));
    if (existingItemIndex === -1) {
        req.flash("error", "Product not found in cart");
        return res.redirect("/cart");
    }
    const existingItem = cartItem.items[existingItemIndex];
    if (existingItem.quantity > 1) {
        existingItem.quantity -= 1;
        cartItem.totalPrice -= product.price;
        cartItem.totalItems -= 1;
    } else {
        cartItem.items.splice(existingItemIndex, 1);
        cartItem.totalPrice -= product.price;
        cartItem.totalItems -= 1;
    }
    await cartItem.save();
    req.flash("success", "Product removed from cart");
    return res.redirect("/cart");
};


// ---------------------------------ORDER---------------------

module.exports.userOrders = async (req, res) => {
    res.render("./users/orders.ejs");
};
module.exports.userOrderDetails = async (req, res) => {
    const { orderId } = req.params;
    res.render("./users/orders.ejs", { orderId });
};
