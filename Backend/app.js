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
const routeResetBD = require('./routes/db')

app.use('/api/users', routeUser);
app.use('/api/auth', routeAuthentification);
app.use('/api/db', routeResetBD);

// Sync DB
db.sync()
  .then(() => console.log('[DB] [ Connexion à la base de données réussie ]'))
  .catch(err => console.error('[DB] [ Erreur de connexion à la base de données ] [ Erreur : ', err.message + ' ]'));

module.exports = app;
