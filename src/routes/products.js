const router = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth);

router.get('/', (req, res) => res.json(req.data.products.list()));

router.post('/', (req, res) => {
  const { name, price } = req.body;
  if (!name) return res.status(400).json({ error: 'Product name is required.' });
  res.status(201).json({ id: req.data.products.create(name, Number(price) || 0) });
});

router.delete('/:id', adminOnly, (req, res) =>
  res.sendStatus(req.data.products.remove(Number(req.params.id)) ? 204 : 404));

module.exports = router;
