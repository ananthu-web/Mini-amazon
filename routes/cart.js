const express = require('express');
const router = express.Router();

router.post('/add-to-cart', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  if (!req.session.cart) req.session.cart = [];
  const { name, price } = req.body;
  const itemIndex = req.session.cart.findIndex(item => item.name === name);

  if (itemIndex > -1) req.session.cart[itemIndex].qty += 1;
  else req.session.cart.push({ name, price: Number(price), qty: 1 });

  res.redirect('/');
});

router.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  res.render('cart', { cart, total });
});

router.post('/remove-from-cart', (req, res) => {
  const { name } = req.body;
  if (!req.session.cart) return res.redirect('/cart');
  const itemIndex = req.session.cart.findIndex(item => item.name === name);
  if (itemIndex > -1) {
    req.session.cart[itemIndex].qty -= 1;
    if (req.session.cart[itemIndex].qty <= 0) req.session.cart.splice(itemIndex, 1);
  }
  res.redirect('/cart');
});

router.post('/increase-qty', (req, res) => {
  const { name } = req.body;
  if (!req.session.cart) return res.redirect('/cart');
  const itemIndex = req.session.cart.findIndex(item => item.name === name);
  if (itemIndex > -1) req.session.cart[itemIndex].qty += 1;
  res.redirect('/cart');
});

router.post('/remove-item', (req, res) => {
  const { name } = req.body;
  if (!req.session.cart) return res.redirect('/cart');
  req.session.cart = req.session.cart.filter(item => item.name !== name);
  res.redirect('/cart');
});

router.post('/checkout', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  if (!req.session.cart || req.session.cart.length === 0) return res.redirect('/cart');
  res.redirect('/success');
});

router.get('/success', (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/');
  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  const formattedDate = deliveryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  res.render('success', { order: { items: cart, total, deliveryDate: formattedDate } });
  req.session.cart = [];
});


module.exports = router;



