const router = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth, adminOnly);

router.get('/', (req, res) => res.json(req.data.users.list()));

router.post('/', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6)
    return res.status(400).json({ error: 'Enter an email and a password of at least 6 characters.' });
  try {
    res.status(201).json({ id: req.data.users.create(email, password, 'member') });
  } catch {
    res.status(409).json({ error: 'That email already exists in this company.' });
  }
});

module.exports = router;
