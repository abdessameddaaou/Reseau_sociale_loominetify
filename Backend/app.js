const express = require('express');
const db = require('./db/db');       // <-- Sequelize instance
const config = require('./config');  // <-- variables env centralisées

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, env: config.env, baseUrl: config.baseUrl });
});

// Routes
const routeUser = require('./routes/User');
const routeAuthentification = require('./routes/Authentification');
app.use('/api/users', routeUser);
app.use('/api/auth', routeAuthentification);

// Sync DB (sans drop)
db.sync()
  .then(() => console.log('[DB] Sync OK'))
  .catch(err => console.error('[DB] Sync error:', err.message));

module.exports = app;
