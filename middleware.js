
const isLogined = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl; // Store the original URL
        req.flash("error", "You must be logged in to access this page");
        return res.redirect("/login");
    }
    next();
}

const saveRedirecturl = (req, res, next) => {
    if(req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

const isAdmin = (req, res, next) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
        req.flash("error", "You must be an admin to access this page");
        return res.redirect("/login");
    }
    next();
}


module.exports = {
    isLogined,
    saveRedirecturl,
    isAdmin
};