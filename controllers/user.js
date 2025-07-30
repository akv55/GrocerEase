const Address = require('../models/address.js');

module.exports.userSignUp = async (req, res) => {
    try {
        let { name, password, email, phone, role } = req.body;
        const newUser = new User({
            username: email,
            email,
            phone,
            name,
            role
        });
        const registeredUser = await User.register(newUser, password);
        res.redirect("/");
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
};


module.exports.userLogin =
    async (req, res) => {
        if (req.user.role === "admin") {
            req.flash("success", "Welcome to the admin dashboard!");
            return res.redirect('/admin/dashboard');
        }
        req.flash("success", "Welcome  To GrocerEase!");
        // let redirectUrl = res.local.redirectUrl || "/";
        // res.redirect(redirectUrl);
        res.redirect('/');
    };


module.exports.userLogout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            next(err);
        }
        req.flash("success", "Logged out successfully!");
        res.redirect('/');
    })
};

module.exports.userProfile = async (req, res) => {
    res.render("./users/profile.ejs", { user: req.user });
};

module.exports.userProfileEdit = async (req, res) => {
    res.render("./users/profile-edit.ejs", { user: req.user });
};

module.exports.userProfileEditPost =async (req, res) => {
    const { name, email, phone } = req.body;
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
};

module.exports.userChangePassword = async (req, res) => {
    res.render("./users/changePassword.ejs", { user: req.user });
};

module.exports.userChangePasswordUpdate=async (req, res) => {
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
    res.redirect("/");
};

module.exports.userAddress=async (req, res) => {

    // Fetch user's address from Address collection
    const userAddress = await Address.findOne({ userId: req.user._id });
    res.render("./users/address.ejs", { user: req.user, address: userAddress });
};

module.exports.userAddressEdit=async (req, res) => {
    // Fetch existing address to populate form
    const userAddress = await Address.findOne({ userId: req.user._id });

    res.render("./users/updateAddress.ejs", { user: req.user, address: userAddress });
};

module.exports.userAddressUpdate=async (req, res) => {

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
};