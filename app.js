const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const port = 8080;
const ejsMate = require("ejs-mate");
const session = require("express-session");
const Listing = require("./models/products.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const flash = require('connect-flash');
const userRouter = require("./routes/user.js")
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const multer = require('multer');
const Address = require('./models/address.js');
require('dotenv').config();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/profiles/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// database connection 
mongoose.set('strictQuery', false);
// const Mongo_url = process.env.MONGO_URL;
const AtlasDB_URL = process.env.ATLASDB_URL;

const connectDB = async () => {
    try {
        await mongoose.connect(AtlasDB_URL);
        console.log("connected to DB");
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

// Session Configuration
const sessionOptions = {
    secret: "mysupersecretstring",
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

// Use user router for authentication routes (mounted before main routes)
app.use("/", userRouter);

// Routes
app.get('/', (req, res) => {
    res.redirect('/listings');
});

// Index Routes 
app.get("/listings", wrapAsync(async (req, res) => {
    const allListings = await Listing.find();
    res.render("./listing/index.ejs", { allListings });
}));

// Show Routes 
app.get("/listings/:slug", wrapAsync(async (req, res) => {
    const listing = await Listing.findOne({ slug: req.params.slug });
    res.render("./listing/show.ejs", { listing });

}));


//admin Routes
app.get("/admin/dashboard", wrapAsync(async (req, res) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to access the admin dashboard");
        return res.redirect("/login");
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
        req.flash("error", "You don't have permission to access the admin dashboard");
        return res.redirect("/");
    }
    const users = await User.find();
    const listings = await Listing.find();
    res.render("./admin/dashboard.ejs", { users, listings });
}));

app.get("/admin/users", wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to access the admin users");
        return res.redirect("/login");
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
        req.flash("error", "You don't have permission to access this page");
        return res.redirect("/");
    }

    const users = await User.find();
    res.render("./admin/users.ejs", { users });
}))
//   USER PROFILE ROUTES 
app.get("/profile", wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to view your profile");
        return res.redirect("/login");
    }
    res.render("./users/profile.ejs", { user: req.user });
}));

app.get("/profile/edit", wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to edit your profile");
        return res.redirect("/login");
    }
    res.render("./users/profile-edit.ejs", { user: req.user });
}));
app.post("/profile/edit", upload.single('profileImage'), wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to edit your profile");
        return res.redirect("/login");
    }
    const { name, email, phone, street, landmark, city, state, country, zip } = req.body;
    try {
        // Update user fields (note: using 'name' not 'username' as per your model)
        if (name && name.trim()) req.user.name = name.trim();
        if (email && email.trim()) req.user.email = email.trim().toLowerCase();
        if (phone && phone.trim()) req.user.phone = phone.trim();

        // Handle file upload for profile image
        if (req.file) {
            // Always create a new profileImage object structure
            req.user.profileImage = {
                filename: req.file.filename,
                url: `/uploads/profiles/${req.file.filename}`
            };
            // Mark the field as modified to ensure Mongoose saves the new structure
            req.user.markModified('profileImage');
        }
        await req.user.save();
        req.flash("success", "Profile updated successfully");
        res.redirect("/profile");
    } catch (error) {
        console.error("Profile update error:", error);
        req.flash("error", "Error updating profile. Please try again.");
        res.redirect("/profile/edit");
    }
}));

app.get("/profile/change_password", wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to view settings");
        return res.redirect("/login");
    }
    res.render("./users/changePassword.ejs", { user: req.user });
}));
app.post("/profile/change-password", wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to change settings");
        return res.redirect("/login");
    }
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
        req.flash("error", "All password fields are required");
        return res.redirect("/settings");
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
        req.flash("error", "New password and confirm password do not match");
        return res.redirect("/settings");
    }

    try {
        // Verify current password
        await req.user.authenticate(currentPassword);

        // Set new password
        await req.user.setPassword(newPassword);
        await req.user.save();

        req.flash("success", "Password changed successfully");
    } catch (error) {
        req.flash("error", "Current password is incorrect");
    }
    res.redirect("/listings");
}));

app.get("/profile/address", wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to view your address");
        return res.redirect("/login");
    }

    // Fetch user's address from Address collection
    const userAddress = await Address.findOne({ userId: req.user._id });

    res.render("./users/address.ejs", { user: req.user, address: userAddress });
}));
app.get("/profile/change-address", wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to change your address");
        return res.redirect("/login");
    }

    // Fetch existing address to populate form
    const userAddress = await Address.findOne({ userId: req.user._id });

    res.render("./users/updateAddress.ejs", { user: req.user, address: userAddress });
}));
app.post("/profile/change-address", wrapAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be logged in to change your address");
        return res.redirect("/login");
    }

    const { street, landmark, city, state, country, zip, isDefault } = req.body;

    try {
        // Optional: unset previous default address if a new default is set
        if (isDefault === 'on') {
            await Address.updateMany({ userId: req.user._id }, { isDefault: false });
        }

        // Check if user already has an address entry (you can allow one or multiple)
        let existingAddress = await Address.findOne({ userId: req.user._id });

        if (existingAddress) {
            // Update the existing address
            existingAddress.address.street = street.trim();
            existingAddress.address.landmark = landmark.trim();
            existingAddress.address.city = city.trim();
            existingAddress.address.state = state.trim();
            existingAddress.address.country = country.trim();
            existingAddress.address.pincode = zip.trim();
            existingAddress.address.isDefault = isDefault === 'on';

            await existingAddress.save();
        } else {
            // Create a new address with correct structure
            await Address.create({
                userId: req.user._id,
                address: {
                    street: street.trim(),
                    landmark: landmark.trim(),
                    city: city.trim(),
                    state: state.trim(),
                    country: country.trim(),
                    pincode: zip.trim(),
                    isDefault: isDefault === 'on'
                }
            });
        }

        req.flash("success", "Address updated successfully");
        res.redirect("/profile/address");
    } catch (error) {
        console.error("Address update error:", error);
        req.flash("error", "Error updating address. Please try again.");
        res.redirect("/profile/change-address");
    }
}));

app.get("/admin/products", wrapAsync(async (req, res) => {
    // if (!req.isAuthenticated()) {
    //     req.flash("error", "You must be an admin to view this page");
    //     return res.redirect("/login");
    // }
    // if (req.user.role !== 'admin') {
    //     req.flash("error", "You don't have permission to access this page");
    //     return res.redirect("/");
    // }
    const products = await Listing.find({});
    res.render("./admin/products.ejs", { products });
}));

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