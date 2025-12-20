const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { checkUser } = require('../controllers/Middleware.js');

router.get('/', checkUser, UserController.getAllUsers);
router.post('/newUser', UserController.createUser);
router.put('/activationCompte', UserController.activerCompteUser);
router.get('/getUserconnected', checkUser, UserController.getUserConnecte);
router.get('/getUser/:id', checkUser, UserController.getUser);
router.put('/updateUser', checkUser, UserController.UpdateInformationsUser);
router.get('/search', checkUser, UserController.getAllUsersSearch);




module.exports = router;
