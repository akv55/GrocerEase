const Listing = require("../models/products.js");
const User = require('../models/user.js');


module.exports.admindashboard = async (req, res) => {
    const users = await User.find();
    const listings = await Listing.find();
    res.render("./admin/dashboard.ejs", { users, listings });
}

module.exports.registerUser = async (req, res) => {
    const users = await User.find();
    res.render("./admin/users.ejs", { users });
}

module.exports.listingsproducts = async (req, res) => {
    const products = await Listing.find({});
    res.render("./admin/products.ejs", { products });
}