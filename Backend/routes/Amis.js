const express = require('express');
const router = express.Router();
const { checkUser } = require('../controllers/Middleware.js');
const AmisController = require('../controllers/AmisController');

router.post('/sendInvitation', checkUser, AmisController.sendInvitation);
router.post('/acceptInvitation', checkUser, AmisController.acceptInvitation);
router.post('/deleteFriend', checkUser, AmisController.deleteFriend);
router.post('/refuseInvitation', checkUser, AmisController.refuseInvitation);
// router.post('/blockUser', checkUser, AmisController.blockUser); 
module.exports = router;