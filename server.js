require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const mongoose = require('mongoose');
const cartRoutes = require('./routes/cart');
const authRouter = require("./routes/auth")
const User = require('./models/User');

const app = express();



// --- MongoDB Connection ---
// mongoose.connect("mongodb://localhost:27017/miniAmazon", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// }).then(() => console.log("✅ MongoDB connected"))
//   .catch(err => console.error("❌ MongoDB connection error:", err));
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));



// --- Session setup ---
app.use(session({
  secret: 'secret123',
  resave: false,
  saveUninitialized: true
}));

// --- Middleware ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // ✅ handle JSON too
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');


// --- Pass user to all views ---
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// --- Routes ---
app.use('/', cartRoutes);
app.use('/', authRouter)



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


// --- Server start ---

// app.listen(process.env.PORT, () => console.log(`🚀 Server running at http://localhost:3000`));
module.exports=app