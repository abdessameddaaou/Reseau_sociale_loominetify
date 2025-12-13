const express = require('express');
const db = require('./db/db');
const config = require('./config');
const cookieParser = require('cookie-parser');
const cors = require("cors")

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(
    cors({
        origin : config.frontendBaseUrl,
        credentials : true,
    })
)
app.set('trust proxy', 1);
// Routes
const routeUser = require('./routes/User');
const routeAuthentification = require('./routes/Authentification');
const routeResetBD = require('./routes/db')
const PublicationRoute = require('./routes/Publication');
const path = require('path');
app.use('/api/publications', PublicationRoute);

app.use('/api/users', routeUser);
app.use('/api/auth', routeAuthentification);
app.use('/api/db', routeResetBD);

// Image public access
app.use('/api/media', express.static(path.join(__dirname, 'uploads')));

// Sync DB
db.sync()
  .then(() => console.log('[DB] [ Connexion à la base de données réussie ]'))
  .catch(err => console.error('[DB] [ Erreur de connexion à la base de données ] [ Erreur : ', err.message + ' ]'));

module.exports = app;
