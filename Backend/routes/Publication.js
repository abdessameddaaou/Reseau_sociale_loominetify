const express = require('express');
const router = express.Router();
const PublicationController = require('../controllers/PublicationController');
const { checkUser } = require('../controllers/Middleware.js');

router.post('/addPost', checkUser, PublicationController.createPublication);

module.exports = router;