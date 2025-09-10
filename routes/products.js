// const express = require("express");
// const router = express.Router();

// // Static products
// const products = [
//   { id: 1, name: "iPhone 15", price: 1200, image: "iphone.png" },
//   { id: 2, name: "MacBook Air", price: 1500, image: "macbook.png" },
//   { id: 3, name: "AirPods Pro", price: 250, image: "airpods.png" }
// ];

// // Homepage
// router.get("/", (req, res) => {
//   res.render("home", { products, user: req.session.userId });
// });

// // Add to cart
// router.post("/add-to-cart", (req, res) => {
//   if (!req.session.cart) req.session.cart = [];
//   const productId = parseInt(req.body.productId);
//   const product = products.find(p => p.id === productId);
//   if (product) req.session.cart.push(product);
//   res.redirect("/cart");
// });

// // Cart page
// router.get("/cart", (req, res) => {
//   res.render("cart", { cart: req.session.cart || [], user: req.session.userId });
// });

// // Checkout route (POST)
// router.post("/checkout", (req, res) => {
//   // Here you can process the order if needed
//   req.session.cart = []; // Clear the cart
//   res.redirect("/checkout-success"); // Redirect to success page
// });

// // Checkout success page
// router.get("/checkout-success", (req, res) => {
//   res.render("success"); // Make sure success.ejs is in your views folder
// });

// module.exports = router;
