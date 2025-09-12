const jwt = require('jsonwebtoken');

function authenticateJWT(req, res, next) {
  const token = req.cookies.token; // make sure you have cookie-parser
  if (!token) {
    res.locals.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, 'your_super_secret_key');
    res.locals.user = decoded; // now templates can access user
  } catch (err) {
    res.locals.user = null;
  }
  next();
}

module.exports = authenticateJWT;
