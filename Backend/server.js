const http = require('http');
const socketio = require('socket.io');
const app = require('./app');
const config = require('./config');
const db = require('./db/db');

/**
 * Normalisation du port
 */
const normalizePort = (val) => {
    const port = parseInt(val, 10);
    if (isNaN(port)) return val;
    if (port >= 0) return port;
    return false;
};

const port = normalizePort(config.port || 3000);
app.set('port', port);

/**
 * Création du serveur HTTP
 */
const server = http.createServer(app);

/**
 * Initialisation Socket.io
 */
const io = socketio(server, {
    cors: {
        origin: config.frontendBaseUrl,
        credentials: true,
        methods: ["GET", "POST"]
    },
});

// Partage de l'instance IO avec Express
app.set('io', io);

// Logs et événements Socket.io
io.on('connection', (socket) => {
    console.log(`[Socket] Nouveau client : ${socket.id} | IP: ${socket.handshake.address}`);

    socket.on('disconnect', (reason) => {
        console.log(`[Socket] Déconnecté : ${socket.id} | Raison: ${reason}`);
    });

    socket.on('error', (err) => {
        console.error(`[Socket] Erreur sur ${socket.id}:`, err);
    });
});

/**
 * Gestionnaire d'erreurs serveur
 */
const errorHandler = (error) => {
    if (error.syscall !== 'listen') throw error;
    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    switch (error.code) {
        case 'EADDRINUSE':
            console.error(`${bind} est déjà utilisé.`);
            process.exit(1);
            break;
        default:
            throw error;
    }
};

server.on('error', errorHandler);

/**
 * Connexion DB + Lancement Serveur
 */
db.sync()
    .then(() => {
        console.log('[DB] Connexion réussie');
        server.listen(port, () => {
            console.log(`[${config.env}] Serveur actif sur ${config.baseUrl}:${port}`);
        });
    })
    .catch(err => {
        console.error('[DB] Erreur fatale :', err.message);
    });