const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { scope } = require('../db');

// The tenant comes from the signed JWT, never from anything the client sends.
function auth(req, res, next) {
  try {
    const token = (req.get('authorization') || '').replace('Bearer ', '');
    req.user = jwt.verify(token, JWT_SECRET);
    req.data = scope(req.user.tid);
    next();
  } catch {
    res.status(401).json({ error: 'Please log in.' });
  }
}

const adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admins only.' });

module.exports = { auth, adminOnly };
