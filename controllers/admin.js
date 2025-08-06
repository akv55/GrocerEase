const Listing = require("../models/products.js");
const User = require('../models/user.js');
const Category = require('../models/category.js');
const Address = require('../models/address.js');
const Cart = require('../models/cart.js');
const Wishlist = require('../models/wishlist.js');
const Order = require('../models/order.js');
const Review = require('../models/reviews.js');
const { cloudinary } = require('../cludeConfig.js');


module.exports.admindashboard = async (req, res, next) => {
    try {
        const users = await User.find();
        const products = await Listing.find();
        return res.render("./admin/dashboard.ejs", { users, products });
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
            slug: product.slug, // Ensure slug is included
            description: product.description,
            price: product.price,
            inStock: product.quantity,
            weight: product.weight,
            location: product.location,
            country: product.country,
            category: product.category
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
            inStock: product.quantity,
            weight: product.weight,
            location: product.location,
            country: product.country,
            category_id: product.category
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
    const userAddress = await Address.findOne({ userId: req.user._id });
        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/admin/users");
        }

        return res.render("./admin/userInfo.ejs", { user, address:userAddress });
    } catch (err) {
        return next(err);
    }
};