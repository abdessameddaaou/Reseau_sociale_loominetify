const express = require('express');
const router = express.Router();
const messagerieController = require('../controllers/MessagerieController');
const { checkUser } = require('../controllers/Middleware'); // Correct middleware import

// Middleware d'authentification pour toutes les routes de messagerie
router.use(checkUser);

// Route pour envoyer un message
router.post('/send', messagerieController.EnvoyerMessage);

module.exports = router;
