const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const config = require('./config');

const app = express();

// Middlewares de base
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.set('trust proxy', 1);

// Configuration CORS
app.use(cors({
    origin: config.frontendBaseUrl,
    credentials: true,
}));

// Accès public aux médias (Images)
app.use('/api/media', express.static(path.join(__dirname, 'uploads')));

// Import des Routes
const routeUser = require('./routes/User');
const routeAuthentification = require('./routes/Authentification');
const routeResetBD = require('./routes/db');
const PublicationRoute = require('./routes/Publication');
const AmisRoute = require('./routes/Amis');
const MessageRoute = require('./routes/Message');
// Déclaration des Routes
app.use('/api/publications', PublicationRoute);
app.use('/api/users', routeUser);
app.use('/api/auth', routeAuthentification);
app.use('/api/db', routeResetBD);
app.use('/api/amis', AmisRoute);
app.use('/api/messages', require('./routes/messagerie'));
app.use('/api/notifications', require('./routes/Notification'));

module.exports = app;