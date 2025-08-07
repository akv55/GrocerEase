const Listing = require("../models/products.js");
const ExpressError = require("../utils/ExpressError.js");
const category = require("../models/category.js");
module.exports.index = async (req, res, next) => {
    try {
        const products = await Listing.find();
        const categories = await category.find();
        return res.render("./listing/index.ejs", { products, categories });
    } catch (err) {
        return next(err);  // Pass unexpected DB errors to global error handler
    }
};

module.exports.showIndex = async (req, res, next) => {
    try {
        const product = await Listing.findOne({ slug: req.params.slug });
        const categories = await category.find();
        if (!product) {
            return next(new ExpressError("Page Not Found", 404));
        }

        return res.render("./listing/show.ejs", { product, categories });
    } catch (err) {
        return next(err);  // Handle DB or query errors
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