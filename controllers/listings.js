const Listing = require("../models/products.js");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find();
    res.render("./listing/index.ejs", { allListings });
};

module.exports.show = async (req, res) => {
    const listing = await Listing.findOne({ slug: req.params.slug });
    res.render("./listing/show.ejs", { listing });

};