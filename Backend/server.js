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
        origin: [
            config.frontendBaseUrl,
            'https://www.loominetify.fr',
            'https://loominetify.fr',
            'http://localhost:4200'
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    },
});

// Partage de l'instance IO avec Express
app.set('io', io);

// Tracking des utilisateurs en ligne
const onlineUsers = new Set();



// Logs et événements Socket.io
io.on('connection', (socket) => {
    console.log(`[Socket] Nouveau client : ${socket.id} | IP: ${socket.handshake.address}`);

    socket.on('joinUserRoom', (userId) => {
        socket.join(`user_${userId}`);
        socket.userId = userId;
        onlineUsers.add(userId);
        io.emit('onlineUsersList', Array.from(onlineUsers));
        console.log(`[Socket] Client ${socket.id} (IP: ${socket.handshake.address}) a rejoint la room: user_${userId}`);
    });

    socket.on('getOnlineUsers', () => {
        socket.emit('onlineUsersList', Array.from(onlineUsers));
    });

    socket.on('disconnect', async (reason) => {
        console.log(`[Socket] Déconnecté : ${socket.id} | Raison: ${reason}`);
        if (socket.userId) {
            const room = io.sockets.adapter.rooms.get(`user_${socket.userId}`);
            if (!room || room.size === 0) {
                onlineUsers.delete(socket.userId);
                io.emit('onlineUsersList', Array.from(onlineUsers));
            }
        }
    });

    // Clean up on error
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
db.sync({ alter: true })
    .then(() => {
        console.log('[DB] Connexion réussie');
        server.listen(port, () => {
            console.log(`[${config.env}] Serveur actif sur ${config.baseUrl}:${port}`);
        });
    })
    .catch(err => {
        console.error('[DB] Erreur fatale :', err.message);
    });