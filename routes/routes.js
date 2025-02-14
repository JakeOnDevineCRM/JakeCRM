const express = require('express');
const router = express.Router();

// Login route
router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/', (req, res) => {
    res.render('login');
});