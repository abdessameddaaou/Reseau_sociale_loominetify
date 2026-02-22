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

// Helper to parse multiple origins from ENV or dynamically add www. prefix
const getAllowedOrigins = (baseUrl) => {
    if (!baseUrl) return '*';
    const origins = baseUrl.split(',').map(s => s.trim());
    const extendedOrigins = new Set(origins);

    origins.forEach(origin => {
        if (origin.startsWith('https://') && !origin.startsWith('https://www.')) {
            extendedOrigins.add(origin.replace('https://', 'https://www.'));
        }
    });
    return Array.from(extendedOrigins);
};

const allowedOrigins = getAllowedOrigins(config.frontendBaseUrl);

// Configuration CORS
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
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
app.use('/api/conversations', require('./routes/conversations'));

module.exports = app;