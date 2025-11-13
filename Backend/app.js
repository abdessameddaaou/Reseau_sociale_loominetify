const express = require('express');
const db = require('./db/db');
const config = require('./config');
const cors = require("cors")

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin : config.frontendBaseUrl,
        credentials : true
    })
)
// Routes
const routeUser = require('./routes/User');
const routeAuthentification = require('./routes/Authentification');
app.use('/api/users', routeUser);
app.use('/api/auth', routeAuthentification);

// Sync DB
db.sync()
  .then(() => console.log('[DB] Sync OK'))
  .catch(err => console.error('[DB] Sync error:', err.message));

module.exports = app;
