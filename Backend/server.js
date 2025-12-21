const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config');

const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const port = normalizePort(config.port);

app.set('port', port);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.frontendBaseUrl,
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const errorHandler = (error) => {
  if (error.syscall !== 'listen') throw error;
  const bind = 'port: ' + port;
  switch (error.code) {
    case 'EADDRINUSE':
      console.error(`${bind} is already in use.`);
      process.exit(1);
    default:
      throw error;
  }
};


server.on('error', errorHandler);
server.on('listening', () => {
  console.log(`[${config.env}] Listening on port ${port} — ${config.baseUrl}`);
});

server.listen(port);
