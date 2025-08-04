const Listing = require("../models/products.js");
const ExpressError = require("../utils/ExpressError.js");

module.exports.index = async (req, res, next) => {
    try {
        const products = await Listing.find();
        return res.render("./listing/index.ejs", { products });
    } catch (err) {
        return next(err);  // Pass unexpected DB errors to global error handler
    }
};

module.exports.showIndex = async (req, res, next) => {
    try {
        const product = await Listing.findOne({ slug: req.params.slug });

        if (!product) {
            return next(new ExpressError("Page Not Found", 404));
        }

        return res.render("./listing/show.ejs", { product });
    } catch (err) {
        return next(err);  // Handle DB or query errors
    }
};
