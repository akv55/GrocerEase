const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/products.js");
const slugify = require("slugify");
const path = require("path");

// Load environment variables from the parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// const MONGO_URL = "mongodb://localhost:27017/GrocerEaseDB";
const AtlasDB_URL = process.env.ATLASDB_URL;

console.log("Environment check in init:");
console.log("ATLASDB_URL defined:", !!AtlasDB_URL);
console.log("ATLASDB_URL length:", AtlasDB_URL ? AtlasDB_URL.length : 0);

mongoose.set('strictQuery', false);
main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    if (!AtlasDB_URL) {
        throw new Error("ATLASDB_URL environment variable is not defined. Please check your .env file.");
    }
    await mongoose.connect(AtlasDB_URL);
}

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({ 
        ...obj, 
        owner: "65f81365b13ea3f1a6b487ce",
        slug: slugify(obj.title, { lower: true, strict: true })
    }));
    await Listing.insertMany(initData.data);
    console.log("Data was initialized");
};


initDB();