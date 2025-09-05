if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
const compression = require('compression');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const port = process.env.PORT || 4000;
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const flash = require('connect-flash');
const ExpressError = require("./utils/ExpressError.js");
const methodOverride = require("method-override");
const Category = require("./models/category.js");
const Cart = require('./models/cart.js');

//  routers
const userRouter = require("./routes/user.js")
const listingRouter = require("./routes/listing.js");
const adminRouter = require("./routes/admin.js");
const authRouter = require("./routes/auth.js");
// database connection 
mongoose.set('strictQuery', false);
// const Mongo_url = process.env.MONGO_URL;
const AtlasDB_URL = process.env.ATLASDB_URL;
const connectDB = async () => {
    try {
        await mongoose.connect(AtlasDB_URL);
        console.log("Connected to MongoDB Atlas successfully");
    } catch (err) {
        console.error("Database connection error:", err);
        process.exit(1);
    }
};
connectDB();
// Enable compression middleware
app.use(compression());
// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));
// MongoDB session store
const store = MongoStore.create({
    mongoUrl: AtlasDB_URL,
    collectionName: 'sessions',
    crypto: {
        secret: process.env.SECRET_KEY,
    },
    touchAfter: 24 * 3600,
    autoRemove: 'native',
    autoRemoveInterval: 10,
});
// Session Configuration
const sessionOptions = {
    store,
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};
// Passport Configuration
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// connect-flash 
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});

app.use(async (req, res, next) => {
    if (req.user) {
        try {
            const cartItem = await Cart.findOne({ user_id: req.user._id }).populate('items.product_id');
            if (cartItem && cartItem.items) {
                // Filter out items with null product_id (deleted products)
                const originalLength = cartItem.items.length;
                cartItem.items = cartItem.items.filter(item => item.product_id !== null);

                // Save if items were removed
                if (cartItem.items.length !== originalLength) {
                    await cartItem.save();
                }
            }
            res.locals.cartItem = cartItem;
        } catch (err) {
            console.error('Error fetching cart data:', err);
            res.locals.cartItem = null;
        }
    } else {
        res.locals.cartItem = null;
    }
    next();
});
app.use(async (req, res, next) => {
    try {
        const categories = await Category.find({});
        res.locals.categories = categories;
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.locals.categories = [];
    }
    next();
});
// --------ROUTES--------
app.get("/health", (req, res) => {
    res.status(200).send("OK");
});
app.use("/", authRouter);
app.use("/", userRouter);
app.use("/", listingRouter);
app.use("/", adminRouter);
// --------ERROR HANDLING--------
app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    return res.status(statusCode).render("error.ejs", { err, user: req.user });
});
// --------SERVER START--------
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
