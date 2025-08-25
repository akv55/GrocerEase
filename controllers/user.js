const mongoose = require('mongoose');
const Address = require('../models/address.js');
const User = require('../models/user.js');
const Cart = require('../models/cart.js');
const Listing = require('../models/products.js');
const Wishlist = require('../models/wishlist.js');
const Order = require('../models/order.js');
const transporter = require('../config/email.js');
const path = require("path");
const ejs = require("ejs");



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
            req.flash("error", "Product already in wishlist");
        }

        return res.redirect("/");
    } catch (error) {
        req.flash("error", "Error adding product to wishlist");
        return res.redirect("/");
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

        res.redirect("/wishlist");
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

module.exports.Orders = async (req, res) => {
    const orders = await Order.find({ userId: req.user._id }).populate('items.product');
    const ordeeItems=
    res.render("./users/orders.ejs", { orders });
};
module.exports.OrderDetails = async (req, res) => {
    const { orderId } = req.params;
     const order = await Order.findById(orderId).populate('items.product');
    if (!order) {
        req.flash("error", "Order not found");
        return res.redirect("/orders");
    }
    res.render("./users/orders.ejs", { order });
};
module.exports.checkoutForm = async (req, res) => {
    try {
        const cartItem = await Cart.findOne({ user_id: req.user._id }).populate('items.product_id');
        const user = req.user;
        const addresses = await Address.find({ userId: req.user._id });

        let totalPrice = 0;
        let totalItems = 0;

        // Check if cart exists and has items
        if (!cartItem || !cartItem.items || cartItem.items.length === 0) {
            req.flash("error", "Your cart is empty. Please add items before checkout.");
            return res.redirect("/cart");
        }

        if (cartItem && cartItem.items) {
            // Filter out items with null product_id (deleted products)
            cartItem.items = cartItem.items.filter(item => item.product_id !== null);

            // Check if cart still has items after filtering
            if (cartItem.items.length === 0) {
                req.flash("error", "Your cart is empty. Please add items before checkout.");
                return res.redirect("/cart");
            }

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

        res.render("./users/checkout.ejs", {
            cartItem,
            user,
            addresses,
            totalPrice,
            totalItems
        });
    } catch (err) {
        req.flash("error", "Error loading checkout page");
        res.redirect("/cart");
    }
};

module.exports.checkoutProcess = async (req, res) => {
    try {
        const { addressId, paymentMethod } = req.body;
        const cartItem = await Cart.findOne({ user_id: req.user._id }).populate('items.product_id');
        const user = req.user;

        // Validate required fields
        if (!addressId) {
            req.flash("error", "Please select a delivery address.");
            return res.redirect("/checkout");
        }

        if (!paymentMethod) {
            req.flash("error", "Please select a payment method.");
            return res.redirect("/checkout");
        }

        // Validate that the address exists and belongs to the user
        const deliveryAddress = await Address.findOne({ _id: addressId, userId: req.user._id });
        if (!deliveryAddress) {
            req.flash("error", "Invalid delivery address selected.");
            return res.redirect("/checkout");
        }

        // Check if cart exists and has items
        if (!cartItem || !cartItem.items || cartItem.items.length === 0) {
            req.flash("error", "Your cart is empty. Please add items before checkout.");
            return res.redirect("/cart");
        }

        // Calculate total amount

        const orderItems = cartItem.items.map(item => ({
            product: item.product_id._id,
            name: item.product_id.title || item.product_id.name,
            quantity: item.quantity,
            price: item.product_id.price
        }));
        const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // Create an order first
        const order = new Order({
            user: user._id,
            items: orderItems,
            totalAmount: totalAmount,
            deliveryAddress: addressId, // Pass the addressId directly as ObjectId
            paymentMethod,
            status: 'Pending'
        });
        await order.save();

        // Prepare address string for email
        const addressString = `${deliveryAddress.address.street}, ${deliveryAddress.address.landmark || ''}, ${deliveryAddress.address.city}, ${deliveryAddress.address.state} - ${deliveryAddress.address.pincode}`;

        await Cart.deleteOne({ user_id: req.user._id });

        // Redirect based on payment method
        if (paymentMethod === "Online") {
            // Redirect to payment page for online payment
            return res.redirect(`/users/${user._id}/payment?orderId=${order._id}&amount=${totalAmount}`);
        } else {
            // For COD, order is complete
            req.flash("success", "Order placed successfully! ");

            // Send order confirmation email
            try {
                const templatePath = path.join(__dirname, "../templates/order-confirmation.ejs");
                const html = await ejs.renderFile(templatePath, {
                    customerName: user.name,
                    orderId: order.orderId || order._id,
                    orderItems: orderItems,
                    orderDate: new Date().toLocaleDateString('en-IN'),
                    orderStatus: 'Confirmed',
                    subtotal: totalAmount,
                    deliveryCharges: 50,
                    totalAmount: totalAmount + 50,
                    discount: 0,
                    deliveryAddress: addressString,
                    expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
                    paymentMethod,
                    supportPhone: process.env.SUPPORT_PHONE || '+91-9876543210',
                    trackOrderLink: `${req.protocol}://${req.get("host")}/orders/${order._id}`,
                    shopMoreLink: `${req.protocol}://${req.get("host")}/`
                });

                await transporter.sendMail({
                    from: `"GrocerEase" <${process.env.EMAIL_USER}>`,
                    to: user.email,
                    subject: "Order Confirmed - GrocerEase",
                    html
                });
                console.log("Order confirmation email sent successfully");
            } catch (emailError) {
                console.error("Failed to send order confirmation email:", emailError);
                // Don't fail the order if email fails
            }

            return res.redirect(`/orders/${order._id}`);
        }

    } catch (err) {
        req.flash("error", "Error processing checkout");
        console.error(err);
        res.redirect("/checkout");
    }
};

//payment
module.exports.paymentForm = async (req, res) => {
    try {
        const { orderId, amount } = req.query;
        const userId = req.params.id;
        res.render('./users/payment.ejs', {
            userId,
            orderId,
            amount
        });
    } catch (err) {
        req.flash("error", "Error loading payment page");
        res.redirect("/cart");
    }
};

module.exports.processPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentOption, orderId } = req.body;

        // Find the order
        const order = await Order.findById(orderId || id);
        if (!order) {
            req.flash("error", "Order not found");
            return res.redirect("/cart");
        }

        // Update order status based on payment completion
        order.status = 'Processing'; // Payment completed
        await order.save();

        req.flash("success", "Payment completed successfully! Your order is being processed.");
        res.redirect(`/orders/${order._id}`);
    } catch (err) {
        req.flash("error", "Error processing payment");
        console.error(err);
        res.redirect("/cart");
    }
};