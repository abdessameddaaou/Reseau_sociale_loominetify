const http = require('http');
const socketio = require('socket.io');
const app = require('./app');
const config = require('./config');
const db = require('./db/db');
const Message = require('./models/message');
const { Users } = require('./models');

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
 * Normalisation et extension des origines CORS (gestion du www. auto)
 */
const getAllowedOrigins = (baseUrl) => {
    if (!baseUrl) return '*';
    const origins = baseUrl.split(',').map(s => s.trim().replace(/\/$/, ''));
    const extendedOrigins = new Set(origins);

    origins.forEach(origin => {
        if (origin.startsWith('https://') && !origin.startsWith('https://www.')) {
            extendedOrigins.add(origin.replace('https://', 'https://www.'));
        }
    });
    return Array.from(extendedOrigins);
};

const allowedOrigins = getAllowedOrigins(config.frontendBaseUrl);

/**
 * Initialisation Socket.io
 */
const io = socketio(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST"]
    },
});

// Partage de l'instance IO avec Express
app.set('io', io);

// Tracking des utilisateurs en ligne
const onlineUsers = new Set();

// Tracking active calls: conversationId -> Set of userIds in the call
const activeCalls = new Map();

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
            // Clean up any active calls they were in to prevent zombie ringing states
            for (const [convId, call] of activeCalls.entries()) {
                // If the user who disconnected was the caller OR was actively in the call
                if (call.callerId === socket.userId || call.participants.has(socket.userId)) {
                    const allMembers = Array.from(new Set([...(call.allParticipants || []), call.callerId]));
                    allMembers.forEach(uid => {
                        if (uid !== socket.userId) {
                            io.to(`user_${uid}`).emit('callEnded', {
                                conversationId: convId,
                                endedBy: socket.userId
                            });
                        }
                    });

                    // Log the abnormal end
                    try {
                        let durationStr = '';
                        if (call.startTime) {
                            const secs = Math.floor((Date.now() - call.startTime) / 1000);
                            const m = Math.floor(secs / 60);
                            const s = secs % 60;
                            durationStr = ` (${m}:${s < 10 ? '0' : ''}${s})`;
                        } else {
                            durationStr = ' manqué';
                        }
                        const cType = call.callType === 'video' ? 'Appel vidéo' : 'Appel vocal';

                        const msg = await Message.create({
                            conversationId: convId,
                            senderId: call.callerId,
                            type: 'call',
                            content: `${cType}${durationStr}`
                        });

                        const Users = require('./models').Users; // Already imported at top, but just to be safe
                        const sender = await Users.findByPk(call.callerId, { attributes: ['nom', 'prenom', 'photo'] });
                        const messageObj = {
                            id: msg.id,
                            conversationId: convId,
                            content: msg.content,
                            type: msg.type,
                            senderId: msg.senderId,
                            senderName: sender ? `${sender.prenom} ${sender.nom}` : 'Utilisateur',
                            senderPhoto: sender ? sender.photo : null,
                            createdAt: msg.createdAt,
                        };
                        allMembers.forEach(uid => {
                            io.to(`user_${uid}`).emit('newMessage', {
                                conversationId: convId,
                                recipientId: uid,
                                message: { ...messageObj, from: uid === msg.senderId ? 'me' : 'them' }
                            });
                        });
                    } catch (err) {
                        console.error('Failed to log call end from disconnect:', err);
                    }
                    activeCalls.delete(convId);
                }
            }

            const room = io.sockets.adapter.rooms.get(`user_${socket.userId}`);
            if (!room || room.size === 0) {
                onlineUsers.delete(socket.userId);
                io.emit('onlineUsersList', Array.from(onlineUsers));
            }
        }
    });

    // ─────────────────────────────────────────
    //  WebRTC Call Signaling
    // ─────────────────────────────────────────

    // Initiate a call – forward offer to all other participants
    socket.on('callUser', (data) => {
        const { conversationId, offer, callType, callerInfo, participants } = data;
        console.log(`[Call] ${socket.userId} calling conversation ${conversationId} (${callType})`);
        console.log(`[Call Debug] Participants provided by frontend:`, participants);

        // Initialize call tracking
        activeCalls.set(conversationId, {
            participants: new Set([socket.userId]),
            allParticipants: participants || [],
            callerId: socket.userId,
            callType: callType,
            startTime: null
        });

        // Send incoming call to all other participants
        if (participants && participants.length) {
            participants.forEach(pid => {
                if (String(pid) !== String(socket.userId)) {
                    console.log(`[Call Debug] Emitting 'incomingCall' to user_${pid}`);
                    io.to(`user_${pid}`).emit('incomingCall', {
                        conversationId,
                        offer,
                        callType,
                        callerInfo,
                        callerId: socket.userId
                    });
                }
            });
        }
    });

    // Answer a call – send answer back to caller
    socket.on('answerCall', (data) => {
        const { conversationId, answer, callerId, answererInfo } = data;
        console.log(`[Call] ${socket.userId} answered call in conversation ${conversationId}`);

        if (activeCalls.has(conversationId)) {
            const call = activeCalls.get(conversationId);
            call.participants.add(socket.userId);
            if (!call.startTime) call.startTime = Date.now();
        }

        io.to(`user_${callerId}`).emit('callAccepted', {
            conversationId,
            answer,
            answererId: socket.userId,
            answererInfo
        });

        // Notify other participants in group call that someone joined
        if (activeCalls.has(conversationId)) {
            activeCalls.get(conversationId).participants.forEach(uid => {
                if (uid !== socket.userId && uid !== callerId) {
                    io.to(`user_${uid}`).emit('callParticipantJoined', {
                        conversationId,
                        userId: socket.userId,
                        answererInfo
                    });
                }
            });
        }
    });

    // Relay ICE candidates between peers
    socket.on('iceCandidate', (data) => {
        const { conversationId, candidate, targetUserId } = data;
        io.to(`user_${targetUserId}`).emit('iceCandidate', {
            conversationId,
            candidate,
            fromUserId: socket.userId
        });
    });

    // End call – notify all participants
    socket.on('endCall', async (data) => {
        const { conversationId } = data;
        console.log(`[Call] ${socket.userId} ended call in conversation ${conversationId}`);

        if (activeCalls.has(conversationId)) {
            const call = activeCalls.get(conversationId);
            const allMembers = Array.from(new Set([...(call.allParticipants || []), call.callerId]));
            allMembers.forEach(uid => {
                if (uid !== socket.userId) {
                    io.to(`user_${uid}`).emit('callEnded', {
                        conversationId,
                        endedBy: socket.userId
                    });
                }
            });

            // LOG MESSAGE
            try {
                let durationStr = '';
                if (call.startTime) {
                    const secs = Math.floor((Date.now() - call.startTime) / 1000);
                    const m = Math.floor(secs / 60);
                    const s = secs % 60;
                    durationStr = ` (${m}:${s < 10 ? '0' : ''}${s})`;
                } else {
                    durationStr = ' manqué';
                }
                const cType = call.callType === 'video' ? 'Appel vidéo' : 'Appel vocal';

                const msg = await Message.create({
                    conversationId: conversationId,
                    senderId: call.callerId, // Author is always the caller
                    type: 'call',
                    content: `${cType}${durationStr}`
                });

                const sender = await Users.findByPk(call.callerId, {
                    attributes: ['nom', 'prenom', 'photo']
                });

                // Broadcast to conversation that a new message (log) exists
                const messageObj = {
                    id: msg.id,
                    conversationId: conversationId,
                    content: msg.content,
                    type: msg.type,
                    senderId: msg.senderId,
                    senderName: sender ? `${sender.prenom} ${sender.nom}` : 'Utilisateur',
                    senderPhoto: sender ? sender.photo : null,
                    createdAt: msg.createdAt,
                };
                const allMembers = Array.from(new Set([...(call.allParticipants || []), call.callerId]));
                if (allMembers.length > 0) {
                    allMembers.forEach(uid => {
                        io.to(`user_${uid}`).emit('newMessage', {
                            conversationId,
                            recipientId: uid,
                            message: { ...messageObj, from: uid === msg.senderId ? 'me' : 'them' }
                        });
                    });
                }
            } catch (err) {
                console.error('Failed to log call end:', err);
            }

            activeCalls.delete(conversationId);
        }
    });

    // Decline an incoming call
    socket.on('declineCall', async (data) => {
        const { conversationId, callerId } = data;
        console.log(`[Call] ${socket.userId} declined call in conversation ${conversationId}`);
        io.to(`user_${callerId}`).emit('callDeclined', {
            conversationId,
            declinedBy: socket.userId
        });

        // LOG MESSAGE
        if (activeCalls.has(conversationId)) {
            const call = activeCalls.get(conversationId);
            try {
                const cType = call.callType === 'video' ? 'Appel vidéo' : 'Appel vocal';
                const msg = await Message.create({
                    conversationId: conversationId,
                    senderId: call.callerId,
                    type: 'call',
                    content: `${cType} décliné`
                });

                const sender = await Users.findByPk(call.callerId, {
                    attributes: ['nom', 'prenom', 'photo']
                });

                const messageObj = {
                    id: msg.id,
                    conversationId: conversationId,
                    content: msg.content,
                    type: msg.type,
                    senderId: msg.senderId,
                    senderName: sender ? `${sender.prenom} ${sender.nom}` : 'Utilisateur',
                    senderPhoto: sender ? sender.photo : null,
                    createdAt: msg.createdAt,
                };
                const allMembers = Array.from(new Set([...(call.allParticipants || []), call.callerId]));
                if (allMembers.length > 0) {
                    allMembers.forEach(uid => {
                        io.to(`user_${uid}`).emit('newMessage', {
                            conversationId,
                            recipientId: uid,
                            message: { ...messageObj, from: uid === msg.senderId ? 'me' : 'them' }
                        });
                    });
                }
            } catch (err) {
                console.error('Failed to log call decline:', err);
            }
            activeCalls.delete(conversationId);
        }
    });

    // Clean up calls on disconnect
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