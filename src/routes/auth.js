const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const { db, scope, slugify } = require('../db');

const sign = (u, t) =>
  jwt.sign({ uid: u.id, tid: t.id, role: u.role, tenant: t.name, email: u.email }, JWT_SECRET, { expiresIn: '8h' });

// Create a new company (tenant) and its first admin
router.post('/register', (req, res) => {
  const { company, email, password } = req.body;
  if (!company || !email || !password || password.length < 6)
    return res.status(400).json({ error: 'Enter a company name, email and a password of at least 6 characters.' });
  const slug = slugify(company);
  if (!slug) return res.status(400).json({ error: 'Enter a valid company name.' });
  if (db.prepare('SELECT 1 FROM tenants WHERE slug=?').get(slug))
    return res.status(409).json({ error: 'That company name is already taken.' });

  const tenant = {
    id: db.prepare('INSERT INTO tenants (slug,name) VALUES (?,?)').run(slug, company).lastInsertRowid,
    name: company,
  };
  const uid = scope(tenant.id).users.create(email, password, 'admin');
  res.status(201).json({ token: sign({ id: uid, role: 'admin', email }, tenant) });
});

router.post('/login', (req, res) => {
  const { company, email, password } = req.body;
  const t = db.prepare('SELECT * FROM tenants WHERE slug=?').get(slugify(company || ''));
  const u = t && db.prepare('SELECT * FROM users WHERE tenant_id=? AND email=?').get(t.id, email);
  if (!u || !bcrypt.compareSync(password || '', u.password_hash))
    return res.status(401).json({ error: 'Company, email or password is incorrect.' });
  res.json({ token: sign(u, t) });
});

module.exports = router;
