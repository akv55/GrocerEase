const Listing = require("../models/products.js");
const ExpressError = require("../utils/ExpressError.js");
const Category = require("../models/category.js");
module.exports.index = async (req, res, next) => {
    try {
        const products = await Listing.find().sort({ createdAt: -1 });
        const categories = await Category.find();
        return res.render("./listing/index.ejs", { products, categories });
    } catch (err) {
        return next(err);  // Pass unexpected DB errors to global error handler
    }
};

module.exports.showIndex = async (req, res, next) => {
    try {
        const product = await Listing.findOne({ slug: req.params.slug });
        const categories = await Category.find();
        if (!product) {
            return next(new ExpressError("Page Not Found", 404));
        }

        return res.render("./listing/show.ejs", { product, categories });
    } catch (err) {
        return next(err);  // Handle DB or query errors
    }
};



module.exports.searchListings = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }
        const regex = new RegExp(query, "i");
        const categories = await Category.find({ name: regex }).select("_id");
        const products = await Listing.find({
            $or: [
                { title: regex },
                { category: { $in: categories.map(cat => cat._id) } }
            ]
        }).populate("category", "name");

        const allCategories = await Category.find();
        return res.render("./listing/search-results.ejs", { results: products, query, categories: allCategories });
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).send({ message: "Server error" });
    }
};

module.exports.filterByCategory = async (req, res, next) => {
    try {
        const { category } = req.query;
        let products;
        let allCategories = await Category.find();
        if (category) {
            const categoryDoc = await Category.findOne({ 
                name: { $regex: new RegExp(category, 'i') } 
            });
            if (categoryDoc) {
                products = await Listing.find({ category: categoryDoc._id }).populate("category", "name");
            } else {
                products = [];
            }
            
            // Render search results page with category filter
            return res.render("./listing/search-results.ejs", { 
                results: products, 
                query: category,
                categories: allCategories,
                filterType: 'category'
            });
        } else {
            // If no category specified, show all products
            products = await Listing.find().populate("category", "name");
            return res.render("./listing/search-results.ejs", { 
                results: products, 
                query: 'All Products',
                categories: allCategories,
                filterType: 'all'
            });
        }
    } catch (error) {
        console.error("Error filtering by category:", error);
        return next(error);
    }
};
