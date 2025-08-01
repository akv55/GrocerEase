const Listing = require("../models/products.js");
const ExpressError = require("../utils/ExpressError.js");

module.exports.index = async (req, res) => {
    const products = await Listing.find();
    res.render("./listing/index.ejs", { products });
};

module.exports.showIndex = async (req, res, next) => {
    const product = await Listing.findOne({ slug: req.params.slug });
    if (!product) {
        return next(new ExpressError("Page Not Found", 404));
    }
    res.render("./listing/show.ejs", { product });
};