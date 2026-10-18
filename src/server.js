const app = require('./app');
const { PORT, JWT_SECRET } = require('./config');

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'dev-secret-change-me') {
  console.error('Set JWT_SECRET in .env or the environment');
  process.exit(1);
}

app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
