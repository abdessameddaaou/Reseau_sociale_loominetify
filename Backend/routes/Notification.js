const express = require('express');
const router = express.Router();
const { checkUser } = require('../controllers/Middleware');
const NotificationController = require('../controllers/NotificationController');

// Récupérer toutes les notifications
router.get('/', checkUser, NotificationController.getNotifications);

// Marquer une notification comme lue
router.post('/:id/read', checkUser, NotificationController.markAsRead);

// Marquer tout comme lu
router.post('/mark-all-read', checkUser, NotificationController.markAllAsRead);

// Actions spécifiques (optionnel si géré par AmisController)
router.post('/:id/accept', checkUser, NotificationController.acceptInvite);
router.post('/:id/decline', checkUser, NotificationController.declineInvite);

module.exports = router;
