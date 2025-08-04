const Listing = require("../models/products.js");
const User = require('../models/user.js');

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

module.exports.listingsproducts = async (req, res, next) => {
    try {
        const products = await Listing.find();
        return res.render("./admin/products.ejs", { products });
    } catch (err) {
        return next(err);
    }
};
