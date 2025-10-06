const Listing = require("../models/products.js");
const User = require('../models/user.js');
const Category = require('../models/category.js');
const Address = require('../models/address.js');
const Cart = require('../models/cart.js');
const Wishlist = require('../models/wishlist.js');
const Order = require('../models/order.js');
const Review = require('../models/reviews.js');
const { cloudinary } = require('../config/cloudinary.js');


module.exports.admindashboard = async (req, res, next) => {
    try {
        const users = await User.find();
        const orders = await Order.find().populate('items.product');
        const products = await Listing.find().populate('category');
        const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
        const categoryData = {};
        products.forEach(product => {
            const categoryName = product.category ? product.category.name : 'Uncategorized';
            if (categoryData[categoryName]) {
                categoryData[categoryName] += 1;
            } else {
                categoryData[categoryName] = 1;
            }
        });
        const orderStatusData = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        const monthlyRevenue = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            monthlyRevenue[monthKey] = 0;
        }

        // Calculate actual monthly revenue from orders
        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const monthKey = orderDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            if (monthlyRevenue.hasOwnProperty(monthKey)) {
                monthlyRevenue[monthKey] += order.totalAmount;
            }
        });

        // Payment method data
        const paymentMethodData = orders.reduce((acc, order) => {
            acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + 1;
            return acc;
        }, {});

        // Payment status data
        const paymentStatusData = orders.reduce((acc, order) => {
            acc[order.paymentStatus] = (acc[order.paymentStatus] || 0) + 1;
            return acc;
        }, {});

        // Top selling products data
        const topProductsData = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const productName = item.name;
                if (topProductsData[productName]) {
                    topProductsData[productName] += item.quantity;
                } else {
                    topProductsData[productName] = item.quantity;
                }
            });
        });

        // Sort top products and take top 10
        const sortedTopProducts = Object.entries(topProductsData)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        const topProductsDataSorted = Object.fromEntries(sortedTopProducts);

        // User registration data
        const userRegistrationData = {};
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            userRegistrationData[monthKey] = 0;
        }

        users.forEach(user => {
            const userDate = new Date(user.createdAt);
            const monthKey = userDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            if (userRegistrationData.hasOwnProperty(monthKey)) {
                userRegistrationData[monthKey] += 1;
            }
        });

        return res.render("./admin/dashboard.ejs", {
            users,
            products,
            orders,
            totalRevenue,
            orderStatusData: JSON.stringify(orderStatusData),
            monthlyRevenue: JSON.stringify(monthlyRevenue),
            categoryData: JSON.stringify(categoryData),
            paymentMethodData: JSON.stringify(paymentMethodData),
            paymentStatusData: JSON.stringify(paymentStatusData),
            topProductsData: JSON.stringify(topProductsDataSorted),
            userRegistrationData: JSON.stringify(userRegistrationData)
        });
    } catch (err) {
        return next(err); // Pass to global error handler
    }
};

module.exports.registerUser = async (req, res, next) => {
    try {
        const users = await User.find();
        return res.render("./admin/users.ejs", { users });
    } catch (err) {
        return next(err);
    }
};

module.exports.deleteUser = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/admin/users");
        }

        // Delete user's profile image from Cloudinary if it's not the default image
        if (user.profileImage.filename && user.profileImage.filename !== "profileImage") {
            try {
                await cloudinary.uploader.destroy(user.profileImage.filename);
            } catch (cloudinaryErr) {
                console.log("Error deleting image from Cloudinary:", cloudinaryErr.message);
                // Continue with deletion even if Cloudinary deletion fails
            }
        }

        // Delete all related data from MongoDB
        await Promise.all([
            Address.deleteMany({ userId: userId }),
            Cart.deleteMany({ user_id: userId }),
            Wishlist.deleteMany({ user: userId }),
            Order.deleteMany({ user: userId }),
            Review.deleteMany({ user_id: userId })
        ]);

        // Finally delete the user
        await User.findByIdAndDelete(userId);

        req.flash("success", "User and all associated data deleted successfully.");
        return res.redirect("/admin/users");
    } catch (err) {
        console.error("Error deleting user:", err);
        req.flash("error", "Failed to delete user. Please try again.");
        return next(err);
    }
};

module.exports.listingsproducts = async (req, res, next) => {
    try {
        const products = await Listing.find();
        const categories = await Category.find();
        return res.render("./admin/products.ejs", { products, categories });
    } catch (err) {
        return next(err);
    }
};

module.exports.newProductForm = async (req, res, next) => {
    try {
        const categories = await Category.find();
        const products = await Listing.find();
        if (!categories || categories.length === 0) {
            req.flash("error", "No categories available. Please create a category first.");
            return res.redirect("/admin/categories");
        }
        return res.render("./admin/newProduct.ejs", { categories, products });
    } catch (err) {
        console.error("Error in newProductForm:", err);
        return next(err);
    }
};

module.exports.deleteListing = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedProduct = await Listing.findByIdAndDelete(id);
        if (!deletedProduct) {
            return next(new ExpressError("Product not found", 404));
        }
        req.flash("success", "Product deleted successfully");
        return res.redirect("/admin/products");
    } catch (err) {
        return next(err);  // Handle DB errors or invalid ID
    }
};
module.exports.categories = async (req, res, next) => {
    try {
        const categories = await Category.find();
        return res.render("./admin/categories.ejs", { categories });
    } catch (err) {
        return next(err);
    }
};

module.exports.createProduct = async (req, res, next) => {
    try {
        const { product } = req.body;

        // Create new product object
        const newProduct = new Listing({
            title: product.title,
            description: product.description,
            price: product.price,
            discount: product.discount,
            inStock: product.inStock,
            weight: {
                value: product.weight.value,
                unit: product.weight.unit
            },
            unit: product.unit,
            category: product.category,
            country: product.country,
            location: product.location,
        });

        // Handle image upload
        if (req.file) {
            newProduct.image = {
                filename: req.file.filename,
                url: req.file.path
            };
        }

        await newProduct.save();
        req.flash("success", "Product created successfully!");
        return res.redirect("/admin/products");
    } catch (err) {
        console.error("Error creating product:", err);
        req.flash("error", "Failed to create product. Please try again.");
        return next(err);
    }
};

module.exports.editProductForm = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await Listing.findById(id);
        const categories = await Category.find();

        if (!product) {
            req.flash("error", "Product not found.");
            return res.redirect("/admin/products");
        }

        return res.render("./admin/editProduct.ejs", { product, categories });
    } catch (err) {
        return next(err);
    }
};

module.exports.editProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { product } = req.body;

        const updatedProduct = await Listing.findByIdAndUpdate(id, {
            title: product.title,
            description: product.description,
            price: product.price,
            discount: product.discount,
            inStock: product.inStock,
            weight: {
                value: product.weight.value,
                unit: product.weight.unit
            },
            location: product.location,
            country: product.country,
            category: product.category
        }, { new: true });

        // Handle image upload if new image is provided
        if (req.file) {
            updatedProduct.image = {
                filename: req.file.filename,
                url: req.file.path
            };
            await updatedProduct.save();
        }

        if (!updatedProduct) {
            req.flash("error", "Product not found.");
            return res.redirect("/admin/products");
        }

        req.flash("success", "Product updated successfully!");
        return res.redirect("/admin/products");
    } catch (err) {
        req.flash("error", "Failed to update product. Please try again.");
        return next(err);
    }
};

module.exports.userInfo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        const userAddress = await Address.findOne({ userId: id });
        const userOrders = await Order.find({ user: id });
        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/admin/users");
        }

        return res.render("./admin/userInfo.ejs", { user, address: userAddress, orders: userOrders });
    } catch (err) {
        return next(err);
    }
};

// --------------------------------manage orders----------------
module.exports.manageOrders = async (req, res, next) => {
    try {
        const orders = await Order.find()
            .populate('items.product')
            .populate('user');

        return res.render("./admin/manageOrders.ejs", { orders });
    } catch (err) {
        return next(err);
    }
};
module.exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
        if (!order) {
            req.flash("error", "Order not found.");
            return res.redirect("/admin/orders");
        }

        req.flash("success", "Order status updated successfully!");
        return res.redirect("/admin/orders");
    } catch (err) {
        req.flash("error", "Failed to update order status. Please try again.");
        return next(err);
    }
};
