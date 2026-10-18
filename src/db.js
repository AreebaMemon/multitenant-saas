const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { DB_PATH } = require('./config');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// Shared schema: all tenants share the same tables, separated by tenant_id.
db.exec(`
  CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    email TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member',
    UNIQUE (tenant_id, email));
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL, price REAL DEFAULT 0);
  CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
  CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
`);

// Tenant-scoped data layer: routes only use this, so a query can never
// forget its tenant_id filter.
const scope = (tid) => ({
  products: {
    list: () => db.prepare('SELECT id,name,price FROM products WHERE tenant_id=?').all(tid),
    create: (n, p) =>
      db.prepare('INSERT INTO products (tenant_id,name,price) VALUES (?,?,?)').run(tid, n, p).lastInsertRowid,
    remove: (id) => db.prepare('DELETE FROM products WHERE id=? AND tenant_id=?').run(id, tid).changes,
  },
  users: {
    list: () => db.prepare('SELECT id,email,role FROM users WHERE tenant_id=?').all(tid),
    create: (email, pw, role) =>
      db.prepare('INSERT INTO users (tenant_id,email,password_hash,role) VALUES (?,?,?,?)')
        .run(tid, email, bcrypt.hashSync(pw, 10), role).lastInsertRowid,
  },
});

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

module.exports = { db, scope, slugify };
