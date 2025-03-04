const express = require('express');
const path = require('path');
const router = express.Router();

// Route for the login page
router.get('/', (req, res) => {
    if (!req.session.user) {
        return res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
    }
    res.sendFile(path.join(__dirname, '..', 'views', 'main-page.html'));
});
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
});

// Handle login form submission
router.post("/login", (req, res) => {
    const { username, password } = req.body; // Get form data

    // Hardcoded example (for testing only)
    if (username === "admin" && password === "password123") {
        req.session.user = username; // Store user in session
        res.redirect("/main"); // Redirect to secret page
    } else {
        res.send('Invalid credentials. <a href="/login">Try again</a>');
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router
