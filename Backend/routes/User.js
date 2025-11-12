const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

router.get('/', UserController.getAllUsers);
router.post('/newUser', UserController.createUser);

module.exports = router;
