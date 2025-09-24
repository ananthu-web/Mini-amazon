
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
//const authenticateJWT = require('./authenticateJWT')
const router = express.Router();



router.get('/user/login', (req, res) => res.render('login'));

router.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("📥 Login data:", req.body);

    if (!email || !password) {
      return res.send("Please enter both email and password.");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.send("Invalid credentials (no such user).");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.send("Invalid credentials (wrong password).");
    }

    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email
    };
    if (!req.session.cart) req.session.cart = [];

    // Generate JWT and set cookie
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log("JWT token:", token);
    res.cookie('token', token, { httpOnly: true });

    console.log("✅ Login successful:", user.email);
    return res.redirect('/');
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).send("Server error during login.");
  }
});

router.get('/user/register', (req, res) => res.render('register'));

router.post('/user/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    console.log("📥 Register data:", req.body);

    if (!username || !email || !password || !confirmPassword) {
      return res.send("All fields are required.");
    }
    if (password !== confirmPassword) {
      return res.send("Passwords do not match.");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.send("Email already registered.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    req.session.user = {
      id: user._id,
      email: user.email,
      username: user.username
    };
    if (!req.session.cart) req.session.cart = [];

    // Generate JWT and set cookie
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log("JWT token:", token);
    res.cookie('token', token, { httpOnly: true });

    console.log("✅ User registered:", user.email);
    return res.redirect('/');
  } catch (err) {
    console.error("❌ Register error:", err);
    return res.status(500).send("Error registering user.");
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;




