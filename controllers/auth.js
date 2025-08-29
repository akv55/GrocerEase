const User = require('../models/user.js');
const crypto = require('crypto');
const transporter = require('../config/email.js');
const path = require("path");
const ejs = require("ejs");
const { title } = require('process');

let otpStore = {};
module.exports.sendOtp = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        // Validate required fields
        if (!name || !email || !phone || !password) {
            req.flash("error", "All fields are required!");
            return res.redirect("/signup");
        }
        // Check existing user
        if (await User.findOne({ email })) {
            req.flash("error", "Email already exists!");
            return res.redirect("/signup");
        }
        if (await User.findOne({ phone })) {
            req.flash("error", "Phone number already exists!");
            return res.redirect("/signup");
        }
        
        // Generate OTP
        const otp = crypto.randomInt(100000, 999999);
        
        // Store data temporarily
        otpStore[email] = {
            otp,
            expires: Date.now() + 5 * 60 * 1000, // 5 minutes
            userData: { name, email, phone, password }
        };

        // Store email in session for verification
        req.session.signupEmail = email;

        // Send OTP (Email)
        const templatePath = path.join(__dirname, "../templates/otp-verification.ejs");
        const html = await ejs.renderFile(templatePath, {
            name,
            otp,
            expires: new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()
        });
        
        await transporter.sendMail({
            from: `"GrocerEase" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "GrocerEase - Your OTP for Signup",
            html
        });

        req.flash("success", "OTP sent to your email!");
        return res.render("./users/signUp-otp.ejs", { email,title:"Verify OTP" }); // Render OTP page
    } catch (err) {
        console.error("Send OTP error:", err);
        req.flash("error", err.message || "Failed to send OTP. Please try again.");
        return res.redirect("/signup");
    }
};


module.exports.resendSignupOtp = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            req.flash("error", "Email is required!");
            return res.redirect("/signup");
        }

        // Check if there's existing data for this email
        if (!otpStore[email] || !otpStore[email].userData) {
            req.flash("error", "Session expired.");
            return res.redirect("/signup");
        }
        
        const userData = otpStore[email].userData;
        
        // Generate new OTP
        const otp = crypto.randomInt(100000, 999999);
        
        // Update stored data with new OTP
        otpStore[email] = {
            otp,
            expires: Date.now() + 5 * 60 * 1000, // 5 minutes
            userData
        };

        // Send OTP (Email)
        const templatePath = path.join(__dirname, "../templates/otp-verification.ejs");
        const html = await ejs.renderFile(templatePath, {
            name: userData.name,
            otp,
            expires: new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()
        });
        
        await transporter.sendMail({
            from: `"GrocerEase" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "GrocerEase - Your New OTP for Signup",
            html
        });

        req.flash("success", "New OTP sent to your email!");
        return res.render("./users/signUp-otp.ejs", { email,title:"Verify-OTP" });
        
    } catch (err) {
        console.error("Resend signup OTP error:", err);
        req.flash("error", err.message || "Failed to resend OTP. Please try again.");
        return res.redirect("/signup");
    }
};

// Verify OTP and complete signup
module.exports.verifySignupOtp = async (req, res) => {
    try {
        const otpInputs = req.body.otp;
        const enteredOtp = otpInputs.join("");

        // Get email from the form or session
        const email = req.body.email || req.session.signupEmail;
        
        if (!email) {
            req.flash("error", "Session expired. ");
            return res.redirect("/signup");
        }

        // Check if OTP exists for this email
        if (!otpStore[email]) {
            req.flash("error", "OTP expired or not found. Please request a new OTP.");
            return res.redirect("/signup");
        }

        const storedData = otpStore[email];

        // Check if OTP has expired
        if (Date.now() > storedData.expires) {
            delete otpStore[email];
            req.flash("error", "OTP expired. Please request a new OTP.");
            return res.redirect("/signup");
        }

        // Convert stored OTP to string for comparison
        if (enteredOtp !== storedData.otp.toString()) {
            req.flash("error", "Invalid OTP. Please try again.");
            return res.render("./users/signUp-otp.ejs", { email,title:"Verify-OTP" });
        }

        // OTP verified successfully - get user data and create user
        const { name, email: userEmail, phone, password, role } = storedData.userData;

        // Double-check for existing users before creating
        const existingEmail = await User.findOne({ email: userEmail });
        if (existingEmail) {
            delete otpStore[email];
            req.flash("error", "Email already exists. Please try another.");
            return res.redirect("/signup");
        }

        const existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            delete otpStore[email];
            req.flash("error", "Phone number already exists. Please try another.");
            return res.redirect("/signup");
        }

        // Create new user
        const newUser = new User({
            username: userEmail,
            email: userEmail,
            phone,
            name,
            role: role || 'user'
        });

        const registeredUser = await User.register(newUser, password);

        // Clean up OTP data
        delete otpStore[email];
        delete req.session.signupEmail;

        // Send welcome email
        try {
            const templatePath = path.join(__dirname, "../templates/welcome-email.ejs");
            const html = await ejs.renderFile(templatePath, {
                name: registeredUser.name,
                email: registeredUser.email
            });
            
            await transporter.sendMail({
                from: `"GrocerEase" <${process.env.EMAIL_USER}>`,
                to: registeredUser.email,
                subject: "Welcome to GrocerEase!",
                html
            });
        } catch (emailError) {
            console.error("Welcome email error:", emailError);
            // Don't fail signup if welcome email fails
        }

        // Auto-login the user
        req.login(registeredUser, function (err) {
            if (err) {
                req.flash("error", "Registration successful but login failed. Please login manually.");
                return res.redirect("/login");
            }
            req.flash("success", "Registration successful! Welcome to GrocerEase!");
            return res.redirect("/");
        });

    } catch (err) {
        console.error("Signup OTP verification error:", err);
        req.flash("error", err.message || "Registration failed. Please try again.");
        return res.redirect("/signup");
    }
};

module.exports.login = async (req, res) => {
    if (req.user.role === "admin") {
        req.flash("success", "Welcome to the admin dashboard!");
        const redirectUrl = res.locals.redirectUrl || '/admin/dashboard';
        return res.redirect(redirectUrl);
    }

    req.flash("success", "Welcome To GrocerEase!");
    const redirectUrl = res.locals.redirectUrl || '/';
    return res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.flash("success", "Logged out successfully!");
        return res.redirect('/');
    });
};

// ---------------------FORGOT PASSWORD------------------

module.exports.forgotPassword = (req, res) => {
    res.render("./users/forgotPassword.ejs",{title:"Forgot Password"});
};


module.exports.forgotPasswordForm = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/forgot-password");
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999);
    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    try {
        // Render EJS template for OTP email
        const templatePath = path.join(__dirname, "../templates/otp-verification.ejs");
        const html = await ejs.renderFile(templatePath, {
            name: user.name,
            otp,
            expires: new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()
        });

        // Send email
        await transporter.sendMail({
            from: `"GrocerEase" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "GrocerEase - OTP Verification",
            html
        });

        req.flash("success", "OTP sent to your email.");
        req.session.otpEmail = email;
        return res.redirect("/verify-otp");
    } catch (error) {
        console.error("Error sending OTP email:", error);
        req.flash("error", "Error sending OTP email");
        return res.redirect("/forgot-password");
    }
};
module.exports.verifyOtpForm = (req, res) => {
    res.render("./users/verify-otp.ejs",{title:"Verify OTP"});
}
module.exports.verifyOtp = async (req, res) => {
    try {
        const otpInputs = req.body.otp;
        const enteredOtp = otpInputs.join("");

        // Get email from session
        const email = req.session.otpEmail;
        if (!email) {
            req.flash("error", "Session expired. Please request OTP again.");
            return res.redirect("/forgot-password");
        }

        // Check if OTP exists for this email
        if (!otpStore[email]) {
            req.flash("error", "OTP expired or not found. Please request a new OTP.");
            return res.redirect("/forgot-password");
        }

        const storedData = otpStore[email];

        // Check if OTP has expired
        if (Date.now() > storedData.expires) {
            delete otpStore[email];
            delete req.session.otpEmail;
            req.flash("error", "OTP expired. Please request a new OTP.");
            return res.redirect("/forgot-password");
        }

        // Convert stored OTP to string for comparison
        if (enteredOtp !== storedData.otp.toString()) {
            req.flash("error", "Invalid OTP. Please try again.");
            return res.redirect("/verify-otp");
        }

        // OTP verified successfully - find user and get password
        const user = await User.findOne({ email });
        if (!user) {
            delete otpStore[email];
            delete req.session.otpEmail;
            req.flash("error", "User not found. Please try again.");
            return res.redirect("/forgot-password");
        }

        // Clean up OTP data
        delete otpStore[email];
        delete req.session.otpEmail;

        // Generate a temporary password or use existing one
        // Note: In production, you should implement proper password reset instead of sending existing password
        const tempPassword = crypto.randomBytes(4).toString('hex');
        const loginLink = `${req.protocol}://${req.get("host")}/login`;
        const supportPhone = process.env.SUPPORT_PHONE || "123-456-7890";
        await user.setPassword(tempPassword);
        await user.save();
        const hours = Date.now() + 24 * 60 * 60 * 1000; // 24 hour from now
        const expiryHours = hours / 3600000; // Convert to hours
        // Send password recovery email
        try {
            const templatePath = path.join(__dirname, "../templates/temporary-password.ejs");
            const html = await ejs.renderFile(templatePath, {
                name: user.name,
                email: user.email,
                tempPassword,
                loginLink,
                expiryHours,
                supportPhone
            });

            await transporter.sendMail({
                from: `"GrocerEase" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "GrocerEase - Password Recovery",
                html
            });

            req.flash("success", "New password has been sent to your email. Please check your inbox.");
            return res.redirect("/login");
        } catch (emailError) {
            console.error("Email sending error:", emailError);
            req.flash("error", "Error sending password recovery email. Please try again.");
            return res.redirect("/forgot-password");
        }

    } catch (error) {
        console.error("OTP verification error:", error);
        req.flash("error", "An unexpected error occurred. Please try again.");
        return res.redirect("/forgot-password");
    }
};

// ----------------------CHANGE PASSWORD---------------
module.exports.ChangePassword = async (req, res) => {
    res.render("./users/changePassword.ejs", { user: req.user, title: "Change Password" });
};

module.exports.PasswordUpdate = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        req.flash("error", "All password fields are required");
        return res.redirect("/settings");
    }

    if (newPassword !== confirmPassword) {
        req.flash("error", "New password and confirm password do not match");
        return res.redirect("/settings");
    }

    try {
        const result = await req.user.authenticate(currentPassword);
        if (!result.user) {
            req.flash("error", "Current password is incorrect");
            return res.redirect("/settings");
        }

        await req.user.setPassword(newPassword);
        await req.user.save();

        req.flash("success", "Password changed successfully");
        return res.redirect("/profile");
    } catch (err) {
        req.flash("error", "Something went wrong while changing password");
        return res.redirect("/settings");
    }
};