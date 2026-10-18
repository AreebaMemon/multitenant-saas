process.env.DB_PATH = ':memory:';
const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

let server, base;
test.before(() => new Promise((r) => {
  server = app.listen(0, () => { base = `http://localhost:${server.address().port}/api`; r(); });
}));
test.after(() => { server.closeAllConnections?.(); server.close(); });

const call = async (path, method = 'GET', body, token) => {
  const r = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) },
    body: body && JSON.stringify(body),
  });
  return { status: r.status, body: r.status === 204 ? null : await r.json().catch(() => null) };
};

test('each tenant only sees its own data', async () => {
  const a = (await call('/register', 'POST', { company: 'Ali Store', email: 'a@a.com', password: 'secret1' })).body.token;
  const b = (await call('/register', 'POST', { company: 'Sara Boutique', email: 's@s.com', password: 'secret2' })).body.token;

  const { body: created } = await call('/products', 'POST', { name: 'Rice', price: 1800 }, a);
  assert.equal((await call('/products', 'GET', null, a)).body.length, 1);
  assert.equal((await call('/products', 'GET', null, b)).body.length, 0);

  // Sara cannot delete Ali's product
  assert.equal((await call('/products/' + created.id, 'DELETE', null, b)).status, 404);
  assert.equal((await call('/products', 'GET', null, a)).body.length, 1);
});

test('requests without login are rejected', async () => {
  assert.equal((await call('/products')).status, 401);
});

test('members cannot use admin features', async () => {
  const admin = (await call('/register', 'POST', { company: 'Zed Co', email: 'z@z.com', password: 'secret3' })).body.token;
  await call('/users', 'POST', { email: 'm@z.com', password: 'secret4' }, admin);
  const member = (await call('/login', 'POST', { company: 'Zed Co', email: 'm@z.com', password: 'secret4' })).body.token;
  assert.equal((await call('/users', 'GET', null, member)).status, 403);
});

test('duplicate company names are rejected', async () => {
  const r = await call('/register', 'POST', { company: 'Ali Store', email: 'x@x.com', password: 'secret5' });
  assert.equal(r.status, 409);
});
