# Tenantly: Multi-tenant SaaS Starter

A small but complete multi-tenant web app built with **Node.js, Express, SQLite and JWT**.
One app and one database serve many companies (tenants), and each company's data stays separate.

## Features
- Create a company: the tenant and its first admin are created together
- JWT login: the tenant is identified from the token
- Roles: `admin` and `member`
- Products (add, list, delete) and team management (admin only)
- Passwords hashed with bcrypt
- Automated tests for tenant isolation

## How multi-tenancy works
Approach: **shared schema with a `tenant_id` column.** Every table has `tenant_id`, indexed.

1. At login, the tenant id (`tid`) is stored inside the signed JWT.
2. `src/middleware/auth.js` verifies the token and sets `req.data = scope(tid)`.
3. `scope(tid)` in `src/db.js` adds the `tenant_id` filter to every query.

Routes never run raw SQL and never trust a `tenant_id` sent by the client, so one tenant cannot read another tenant's data.

## Getting started
```bash
git clone <your-repo-url>
cd multitenant-saas
npm install
npm start          # http://localhost:3000
```
Optional: copy `.env.example` to `.env` to set `JWT_SECRET`, `PORT` and `DB_PATH`.
Run the tests with `npm test`.

## Project structure
```
src/
  app.js          Express app and routes
  server.js       Server start
  config.js       Environment variables
  db.js           Schema and tenant-scoped data layer
  middleware/     JWT auth and admin check
  routes/         auth, products, users
public/           Website (HTML, CSS, JS)
test/             Isolation tests
```

## API
| Method | Path | Access |
|---|---|---|
| POST | `/api/register` | public |
| POST | `/api/login` | public |
| GET, POST | `/api/products` | logged in |
| DELETE | `/api/products/:id` | admin |
| GET, POST | `/api/users` | admin |

## Before going to production
- Set `JWT_SECRET` to a long random value
- Serve over HTTPS and rate-limit the login route
- At larger scale, move from SQLite to Postgres with Row Level Security

## License
MIT
