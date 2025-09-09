const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();

// --- MongoDB Connection ---
mongoose.connect("mongodb://localhost:27017/miniAmazon", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// --- Models ---
const User = require('./models/User');

// --- Middleware ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // ✅ handle JSON too
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// --- Session setup ---
app.use(session({
  secret: 'secret123',
  resave: false,
  saveUninitialized: true
}));

// --- Pass user to all views ---
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// --- Routes ---

// Home page → Fetch products from JSON
app.get('/', async (req, res) => {
  try {
    const dataPath = path.join(__dirname, 'products.json');
    const rawData = fs.readFileSync(dataPath);
    let products = JSON.parse(rawData);

    // Search filter
    const searchQuery = req.query.search;
    if (searchQuery) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.desc.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    console.log("Products length:", products.length);
    res.render('home', { products });
  } catch (err) {
    console.error("❌ Error loading products:", err);
    res.status(500).send("Error loading products");
  }
});

// --- Cart functionality ---
app.post('/add-to-cart', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  if (!req.session.cart) req.session.cart = [];
  const { name, price } = req.body;
  const itemIndex = req.session.cart.findIndex(item => item.name === name);

  if (itemIndex > -1) req.session.cart[itemIndex].qty += 1;
  else req.session.cart.push({ name, price: Number(price), qty: 1 });

  res.redirect('/');
});

app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  res.render('cart', { cart, total });
});

app.post('/remove-from-cart', (req, res) => {
  const { name } = req.body;
  if (!req.session.cart) return res.redirect('/cart');
  const itemIndex = req.session.cart.findIndex(item => item.name === name);
  if (itemIndex > -1) {
    req.session.cart[itemIndex].qty -= 1;
    if (req.session.cart[itemIndex].qty <= 0) req.session.cart.splice(itemIndex, 1);
  }
  res.redirect('/cart');
});

app.post('/increase-qty', (req, res) => {
  const { name } = req.body;
  if (!req.session.cart) return res.redirect('/cart');
  const itemIndex = req.session.cart.findIndex(item => item.name === name);
  if (itemIndex > -1) req.session.cart[itemIndex].qty += 1;
  res.redirect('/cart');
});

app.post('/remove-item', (req, res) => {
  const { name } = req.body;
  if (!req.session.cart) return res.redirect('/cart');
  req.session.cart = req.session.cart.filter(item => item.name !== name);
  res.redirect('/cart');
});

app.post('/checkout', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!req.session.cart || req.session.cart.length === 0) return res.redirect('/cart');
  res.redirect('/success');
});

app.get('/success', (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/');
  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  const formattedDate = deliveryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  res.render('success', { order: { items: cart, total, deliveryDate: formattedDate } });
  req.session.cart = [];
});

// --- Login / Register / Logout ---
app.get('/login', (req, res) => res.render('login'));

app.post('/login', async (req, res) => {
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

    req.session.user = { id: user._id, username: user.username, email: user.email };
    if (!req.session.cart) req.session.cart = [];

    console.log("✅ Login successful:", user.email);
    return res.redirect('/');
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).send("Server error during login.");
  }
});

app.get('/register', (req, res) => res.render('register'));

app.post('/register', async (req, res) => {
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
    const user = await User.create({ username, email, password: hashedPassword });

    req.session.user = { id: user._id, email: user.email, username: user.username };
    if (!req.session.cart) req.session.cart = [];

    console.log("✅ User registered:", user.email);
    return res.redirect('/');
  } catch (err) {
    console.error("❌ Register error:", err);
    return res.status(500).send("Error registering user.");
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// --- Server start ---
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
