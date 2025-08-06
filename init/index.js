const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/products.js");
const slugify = require("slugify");
const path = require("path");
const Category = require("../models/category.js");
const cateData = require("./abcd.js");
// const Category = require("../models/category.js");

// Load environment variables from the parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URL = process.env.MONGO_URL;
// const AtlasDB_URL = process.env.ATLASDB_URL;

// console.log("Environment check in init:");
// console.log("ATLASDB_URL defined:", );
// console.log("ATLASDB_URL length:", AtlasDB_URL ? AtlasDB_URL.length : "undefined");

mongoose.set('strictQuery', false);
main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    if (!MONGO_URL) {
        throw new Error("MONGO_URL environment variable is not defined. Please check your .env file.");
    }
    await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});
    await Category.deleteMany({});
    initData.data = initData.data.map((obj) => ({ 
        ...obj, 
        owner: "65f81365b13ea3f1a6b487ce",
        slug: slugify(obj.title, { lower: true, strict: true })
    }));
    await Category.insertMany(cateData.categories);
    await Listing.insertMany(initData.data);
    console.log("Data was initialized");
};


initDB();