const express = require('express');
const router = express.Router();
const { checkUser } = require('../controllers/Middleware.js');
const MessageController = require('../controllers/MessageController');


router.post('/sendMessage', checkUser, MessageController.sendMessage);
module.exports = router;