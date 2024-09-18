const User = require('../models/users');

function auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.json({ result: false, error: 'Token required' });
  }

  User.findOne({ token: token }).then(user => {
    if (!user) {
      return res.json({ result: false, error: 'Invalid token' });
    }

    req.user = user;
    next();
  }).catch(err => {
    res.json({ result: false, error: 'Server error' });
  });
}

module.exports = auth;
