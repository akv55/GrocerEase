const Address = require('../models/address.js');
const User = require('../models/user.js');
const Cart = require('../models/cart.js');
const Listing = require('../models/products.js');

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

// User Profile Controller
module.exports.userProfile = async (req, res) => {
    res.render("./users/profile.ejs", { user: req.user });
};

module.exports.userProfileForm = async (req, res) => {
    res.render("./users/profile-edit.ejs", { user: req.user });
};

module.exports.userProfileEdit = async (req, res) => {
    const { name, email, phone } = req.body;

    if (name && name.trim()) req.user.name = name.trim();
    if (email && email.trim()) req.user.email = email.trim().toLowerCase();
    if (phone && phone.trim()) req.user.phone = phone.trim();
    if (req.file) {
        req.user.profileImage = {
            filename: req.file.filename,
            url: req.file.path
        };
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
    const cartItem = await Cart.findOne({ user_id: req.user._id }).populate('items.product_id');
    let totalPrice = 0;
    let totalItems = 0;
    
    if (cartItem && cartItem.items) {
        cartItem.items.forEach(item => {
            totalPrice += item.product_id.price * item.quantity;
            totalItems += item.quantity;
        });
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
