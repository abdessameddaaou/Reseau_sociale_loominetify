const http = require('http');
const app = require('./app');

/**
 * 
 * @param {*} val 
 * @returns 
 */
const normalizePort = val => {
const port = parseInt(val, 10);

  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

/**
 * Set port
 */
const port = normalizePort(process.env.PORT ||'3500');
app.set('port', port);

/**
 * @param {*} error 
 */
const errorHandler = error => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
  switch (error.code) {
    case 'EADDRINUSE':
      console.error(bind + ' is already in use.');
      process.exit(1);
      return;
    default:
      throw error;
  }
};

/**
 * Create server
 */
const server = http.createServer(app);

/**
 * Event listener for HTTP server "error" event.
 */
server.on('error', errorHandler);

/**
 * Event listener for HTTP server "listening" event.
 */
server.on('listening', () => {
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
  console.log('Listening on ' + bind);
});

/**
 * Start server
 */
server.listen(port);