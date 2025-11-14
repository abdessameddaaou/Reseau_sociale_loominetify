const http = require('http');
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

const server = http.createServer(app);
server.on('error', errorHandler);
server.on('listening', () => {
  console.log(`[${config.env}] Listening on port ${port} — ${config.baseUrl}`);
});

server.listen(port);
