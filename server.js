const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // ✅ added bcrypt

// Models
const User = require('./models/User');
const Product = require('./models/product');

const app = express();

// --- Connect to MongoDB ---
mongoose.connect("mongodb://localhost:27017/miniAmazon", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Middleware ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // serve css/images
app.set('view engine', 'ejs');

// --- Session setup ---
app.use(session({
  secret: 'secret123', // change this in production
  resave: false,
  saveUninitialized: true
}));

// --- Pass user to all views ---
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// --- Routes ---

// Home page → Fetch products from DB
app.get('/', async (req, res) => {
  const products = await Product.find({});
  res.render('home', { products });
});

// Add to Cart
app.post('/add-to-cart', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  if (!req.session.cart) req.session.cart = [];

  const { name, price } = req.body;
  const itemIndex = req.session.cart.findIndex(item => item.name === name);

  if (itemIndex > -1) {
    req.session.cart[itemIndex].qty += 1;
  } else {
    req.session.cart.push({
      name,
      price: Number(price),
      qty: 1
    });
  }

  res.redirect('/');
});

// Cart page
app.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  let total = 0;
  cart.forEach(item => total += item.price * item.qty);
  res.render('cart', { cart, total });
});

// ✅ Remove 1 from cart
app.post('/remove-from-cart', (req, res) => {
  const { name } = req.body;
  if (!req.session.cart) return res.redirect('/cart');

  const itemIndex = req.session.cart.findIndex(item => item.name === name);

  if (itemIndex > -1) {
    req.session.cart[itemIndex].qty -= 1;

    // If qty = 0 → remove item completely
    if (req.session.cart[itemIndex].qty <= 0) {
      req.session.cart.splice(itemIndex, 1);
    }
  }

  res.redirect('/cart');
});

// ✅ Increase qty in cart
app.post('/increase-qty', (req, res) => {
  const { name } = req.body;
  if (!req.session.cart) return res.redirect('/cart');

  const itemIndex = req.session.cart.findIndex(item => item.name === name);
  if (itemIndex > -1) {
    req.session.cart[itemIndex].qty += 1;
  }

  res.redirect('/cart');
});

// ✅ Remove entire item
app.post('/remove-item', (req, res) => {
  const { name } = req.body;
  if (!req.session.cart) return res.redirect('/cart');

  req.session.cart = req.session.cart.filter(item => item.name !== name);

  res.redirect('/cart');
});

// Checkout
app.post('/checkout', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!req.session.cart || req.session.cart.length === 0) return res.redirect('/cart');
  res.redirect('/success');
});

// Success page
app.get('/success', (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/');

  let total = 0;
  cart.forEach(item => total += item.price * item.qty);

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  const formattedDate = deliveryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  res.render('success', {
    order: {
      items: cart,
      total,
      deliveryDate: formattedDate
    }
  });

  // Clear cart
  req.session.cart = [];
});

// Login
app.get('/login', (req, res) => res.render('login'));
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.redirect('/login');

  const user = await User.findOne({ email });
  if (!user) return res.send("Invalid credentials");

  // ✅ compare hashed password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.send("Invalid credentials");

  req.session.user = { id: user._id, username: user.username, email: user.email };
  if (!req.session.cart) req.session.cart = [];
  res.redirect('/');
});

// Register
app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) return res.redirect('/register');
  if (password !== confirmPassword) return res.redirect('/register');

  try {
    // ✅ hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ username, email, password: hashedPassword });
    req.session.user = { id: user._id, email: user.email, username: user.username };
    if (!req.session.cart) req.session.cart = [];
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.send("Error registering user");
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// --- Server start ---
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
