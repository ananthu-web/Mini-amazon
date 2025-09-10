// const express = require("express");
// const router = express.Router();
// const User = require("../models/User");

// // GET pages
// router.get("/login", (req, res) => res.render("login"));
// router.get("/register", (req, res) => res.render("register"));
// router.get("/logout", (req, res) => {
//   req.session.destroy(() => res.redirect("/login"));
// });

// // POST forms
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   const user = await User.findOne({ email, password });
//   if (user) {
//     req.session.userId = user._id;
//     res.redirect("/");
//   } else {
//     res.send("Invalid email or password");
//   }
// });

// router.post("/register", async (req, res) => {
//   const { username, email, password, confirmPassword } = req.body;
//   if (password !== confirmPassword) return res.send("Passwords do not match");
//   try {
//     const user = await User.create({ username, email, password });
//     req.session.userId = user._id;
//     res.redirect("/");
//   } catch (err) {
//     res.send("Error registering user");
//   }
// });

// module.exports = router;
