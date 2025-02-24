const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const app = express();
const upload = multer();

app.use(express.static(path.join(__dirname, 'public'))); // Serve static assets
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.json()); // Handle JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload.array());
app.use(cookieParser());
app.use(session({ secret: "Mellon", resave: false, saveUninitialized: true }));
app.use('/', authRoutes);
app.use('/', userRoutes);

const port = process.env.PORT || 3002;
app.listen(port, () => {
    console.log(`Example App Listening on Port ${port}`);
});
