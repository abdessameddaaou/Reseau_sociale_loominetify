const express = require('express')
const router = express.Router()
const AuthentificationController = require('../controllers/AuthentificationController')
const Middleware = require('../controllers/Middleware.js')
const { checkUser } = require('../controllers/Middleware.js');


router.post('/login', AuthentificationController.loginUser)
router.post('/logout', AuthentificationController.logoutUser)
router.get('/UserConnecte', checkUser, Middleware.UserConnecte)

router.post('/forgotpassword', AuthentificationController.demandeReinitialisation)
router.post('/checkcode', AuthentificationController.checkCodeReinitialisation)
router.put('/resetpassword', AuthentificationController.resetPasswordUser)

module.exports = router;