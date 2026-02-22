const express = require('express');
const router = express.Router();
const { checkUser } = require('../controllers/Middleware.js');
const AmisController = require('../controllers/AmisController');

router.post('/sendInvitation', checkUser, AmisController.sendInvitation);
router.post('/acceptInvitation', checkUser, AmisController.acceptInvitation);
router.post('/deleteFriend', checkUser, AmisController.deleteFriend);
router.post('/refuseInvitation', checkUser, AmisController.refuseInvitation);
router.post('/blockUser', checkUser, AmisController.blockUser);
router.post('/unblockUser', checkUser, AmisController.unblockUser);
router.post('/followUser', checkUser, AmisController.followUser);
router.delete('/unfollowUser/:id', checkUser, AmisController.unfollowUser);
module.exports = router;