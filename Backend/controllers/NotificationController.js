const { Notification, Users, UserRelation, UserFollow } = require('../models');
const { Op } = require('sequelize');

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
 * Accepter une invitation d'ami via notification
 * Trouve la notification, accepte la relation d'ami, crée les follows mutuels
 */
module.exports.acceptInvite = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        // 1. Trouver la notification
        const notification = await Notification.findOne({
            where: { id, recipientId: userId, type: 'invite' }
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification d'invitation introuvable" });
        }

        const requesterId = notification.senderId;

        // 2. Trouver la relation d'ami en attente
        const relation = await UserRelation.findOne({
            where: {
                requesterId: requesterId,
                addresseeId: userId,
                status: "envoyée"
            }
        });

        if (!relation) {
            // Marquer la notif comme lue même si la relation n'existe plus
            notification.read = true;
            await notification.save();
            return res.status(404).json({ message: "Aucune invitation en attente trouvée" });
        }

        // 3. Accepter la relation
        relation.status = "acceptée";
        await relation.save();

        // 4. Créer les follows mutuels
        const existingFollow1 = await UserFollow.findOne({
            where: { followerId: userId, followingId: requesterId }
        });
        const existingFollow2 = await UserFollow.findOne({
            where: { followerId: requesterId, followingId: userId }
        });

        if (!existingFollow1) {
            await UserFollow.create({ followerId: userId, followingId: requesterId });
        }
        if (!existingFollow2) {
            await UserFollow.create({ followerId: requesterId, followingId: userId });
        }

        // 5. Marquer la notification comme lue
        notification.read = true;
        await notification.save();

        // 6. Notification + Socket pour informer l'expéditeur
        const io = req.app.get('io');
        const userAccepter = await Users.findByPk(userId);

        const notifAccept = await Notification.create({
            recipientId: requesterId,
            senderId: userId,
            type: 'accept',
            message: `${userAccepter.prenom} ${userAccepter.nom} a accepté votre invitation`,
            relatedId: userId
        });

        if (io) {
            // Emit follow mutuel
            io.emit('newFollow', { followerId: userId, followingId: requesterId });
            io.emit('newFollow', { followerId: requesterId, followingId: userId });

            // Notif pour l'expéditeur original
            io.emit('newNotification', {
                recipientId: requesterId,
                notification: {
                    id: notifAccept.id,
                    type: 'accept',
                    message: notifAccept.message,
                    sender: {
                        id: userAccepter.id,
                        nom: userAccepter.nom,
                        prenom: userAccepter.prenom,
                        photo: userAccepter.photo,
                        username: userAccepter.username
                    },
                    read: false,
                    createdAt: notifAccept.createdAt
                }
            });
        }

        return res.status(200).json({ message: "Invitation acceptée avec succès" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};

/**
 * Refuser une invitation d'ami via notification
 */
module.exports.declineInvite = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        // 1. Trouver la notification
        const notification = await Notification.findOne({
            where: { id, recipientId: userId, type: 'invite' }
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification d'invitation introuvable" });
        }

        const requesterId = notification.senderId;

        // 2. Trouver et refuser la relation
        const relation = await UserRelation.findOne({
            where: {
                requesterId: requesterId,
                addresseeId: userId,
                status: "envoyée"
            }
        });

        if (relation) {
            // Supprimer la relation pour permettre un renvoi ultérieur
            await relation.destroy();
        }

        // 3. Marquer la notification comme lue
        notification.read = true;
        await notification.save();

        return res.status(200).json({ message: "Invitation refusée" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};
