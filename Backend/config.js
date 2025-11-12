// Backend/config.js
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const APP_ENV = process.env.APP_ENV || process.env.NODE_ENV || 'development';
const envFile = path.resolve(__dirname, `.env.${APP_ENV}`);

if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {

  dotenv.config();
}

const config = {
  env: APP_ENV,
  port: Number(process.env.PORT || 3500),

  // URL “publique” de l’API (optionnel, utile pour CORS / liens)
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3500}`,

  db: {
    dialect: process.env.DB_DIALECT || 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    name: process.env.DB_NAME || 'reseau',
    user: process.env.DB_USER || 'root',
    pass: process.env.DB_PASS || '',
    logging: (process.env.DB_LOGGING || 'false').toLowerCase() === 'true'
  },
};

module.exports = config;
