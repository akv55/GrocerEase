if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
const express = require('express');
const app = express();
exports.app = app;
const mongoose = require('mongoose');
const path = require('path');
const port = 8080;
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const flash = require('connect-flash');
const ExpressError = require("./utils/ExpressError.js");

//  routers
const userRouter = require("./routes/user.js")
const listingRouter = require("./routes/listing.js");
const adminRouter = require("./routes/admin.js");




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

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
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


// store.on("error", (err) => {
//     console.log("ERROR in MONGO SESSION STORE:", err);
// });

// store.on("connected", () => {
//     console.log("MongoDB session store connected successfully");
// });

// store.on("create", (sessionId) => {
//     console.log("Session created:", sessionId);
// });
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

app.use("/", userRouter);
app.use("/", listingRouter);
app.use("/", adminRouter);

// Test route to check session creation
app.get("/test-session", (req, res) => {
    if (!req.session.views) {
        req.session.views = 1;
    } else {
        req.session.views++;
    }
    res.json({
        message: "Session test successful",
        views: req.session.views,
        sessionId: req.sessionID
    });
});



app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).send(message);
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});