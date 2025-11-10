const express = require('express')
const router = express.Router()
const AuthentificationController = require('../controllers/Authentification')

router.post('/login', AuthentificationController.loginUser)
// router.post('/logout', AuthentificationController.logoutUser)
// router.post('/forgotpassword', AuthentificationController.forgotPasswordUser)
// router.put('/resetpassword', AuthentificationController.resetPasswordUser)

module.exports = router;