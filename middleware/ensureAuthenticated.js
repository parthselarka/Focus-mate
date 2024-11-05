// middleware/ensureAuthenticated.js

// Simple middleware to check if the user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.userId) { // assuming `userId` is set upon successful login
        return next();
    } else {
        // Redirect to login page or send an unauthorized response
        res.status(401).send('Unauthorized: No session available');
    }
}

module.exports = ensureAuthenticated;
