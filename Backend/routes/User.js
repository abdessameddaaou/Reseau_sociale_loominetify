const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { checkUser } = require('../controllers/Middleware.js');

router.get('/', checkUser, UserController.getAllUsers);
router.post('/newUser', UserController.createUser);
router.put('/activationCompte', UserController.activerCompteUser);

module.exports = router;
