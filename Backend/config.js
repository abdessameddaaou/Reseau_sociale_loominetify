// importation des bibliothèques
const path = require('path');
const dotenv = require('dotenv');


// Vérifier si APP.ENV ( valeur APP.ENV saisi lors du lancement ) existe dans les fichiers sinon on utilise development
const APP_ENV = process.env.APP_ENV || 'development';

// Récupérer le chemin vers le fichier env souhaité
const envFile = path.resolve(__dirname, `.env.${APP_ENV}`);

// Charger le fichier souhaité
dotenv.config({ path: envFile });


// récupération des valeurs depuis le fichier .env
const config = {

  env: APP_ENV,
  port: Number(process.env.PORT || 3500),

  baseUrl: process.env.BASE_URL || 'http://localhost:3500',
  frontendBaseUrl: process.env.BASE_URL_Frontend || 'http://localhost:4200', // pour le CORS

  // Charger les données de la base 
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
