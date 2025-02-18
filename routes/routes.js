const express = require('express');
const path = require('path'); // Import the path module

const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
});

// Route for the login page
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
});

// Handle login form submission (POST request)
router.post('/login', (req, res) => {
    const { username, password } = req.body; // Get form data

    // Hardcode example for test
    if (username === 'admin' && password === 'password123') {
        req.session.user = username; // Store user in session
        res.redirect('/secret'); // Redirect to secret page
    } else {
        res.send('Invalid credentials. <a href="/login">Try again</a>');
    }
});

// Serve secret page (GET request)
router.get('/secret', (req, res) => {
    if (!req.session.user) {
        return res.send('Unauthorized. <a href="/login">Login</a>');
    }
    res.sendFile(path.join(__dirname, '..', 'views', 'secret.html'));
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;
