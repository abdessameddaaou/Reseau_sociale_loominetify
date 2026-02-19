const { Notification, Users } = require('../models');

/**
 * Récupérer les notifications de l'utilisateur connecté
 */
module.exports.getNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        const notifications = await Notification.findAll({
            where: { recipientId: userId },
            include: [
                {
                    model: Users,
                    as: 'sender',
                    attributes: ['id', 'nom', 'prenom', 'photo', 'username']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur lors de la récupération des notifications", error: error.message });
    }
};

/**
 * Marquer une notification comme lue
 */
module.exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const notification = await Notification.findOne({
            where: { id, recipientId: userId }
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification introuvable" });
        }

        notification.read = true;
        await notification.save();

        return res.status(200).json({ message: "Notification marquée comme lue" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

/**
 * Marquer toutes les notifications comme lues
 */
module.exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.userId;

        await Notification.update(
            { read: true },
            { where: { recipientId: userId, read: false } }
        );

        return res.status(200).json({ message: "Toutes les notifications marquées comme lues" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

/**
 * Accepter une invitation (via notification)
 * Redirige vers la logique AmisController
 */
module.exports.acceptInvite = async (req, res) => {
    // Cette logique est déjà gérée par le AmisController, 
    // mais on pourrait ajouter ici la logique spécifique si on passe par l'ID de notif
    return res.status(200).json({ message: "Utilisez l'endpoint /amis/acceptInvitation" });
}

module.exports.declineInvite = async (req, res) => {
    return res.status(200).json({ message: "Utilisez l'endpoint /amis/refuseInvitation" });
}
