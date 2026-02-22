const { UserRelation, UserFollow, Users, Notification, UserBlock } = require("../models");
const { Op } = require("sequelize");

/** * Envoyer une invitation d'ami
 */
module.exports.sendInvitation = async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.userId;

        const friend = await Users.findByPk(friendId);
        if (!friend) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }

        if (userId == friendId) {
            return res.status(400).json({ message: "Vous ne pouvez pas vous ajouter vous-même" });
        }

        const existingInvitation = await UserRelation.findOne({
            where: {
                [Op.or]: [
                    { requesterId: userId, addresseeId: friendId },
                    { requesterId: friendId, addresseeId: userId }
                ]
            }
        });

        if (existingInvitation) {
            return res.status(400).json({ message: "Une invitation ou une amitié existe déjà", status: existingInvitation.status });
        }

        await UserRelation.create({
            requesterId: userId,
            addresseeId: friendId,
            status: "envoyée"
        });

        // NOTIFICATION + SOCKET
        const io = req.app.get('io');
        const userSender = await Users.findByPk(userId);

        // Créer notif
        const notif = await Notification.create({
            recipientId: friendId,
            senderId: userId,
            type: 'invite',
            message: `${userSender.prenom} ${userSender.nom} vous a envoyé une invitation d'ami`,
            relatedId: userId // Lien vers le profil
        });

        // Emit Socket
        if (io) {
            io.emit('newNotification', {
                recipientId: friendId,
                notification: {
                    id: notif.id,
                    type: 'invite',
                    message: notif.message,
                    sender: {
                        id: userSender.id,
                        nom: userSender.nom,
                        prenom: userSender.prenom,
                        photo: userSender.photo,
                        username: userSender.username
                    },
                    read: false,
                    createdAt: notif.createdAt
                }
            });
            console.log(`[Socket] Notification 'invite' sent to user ${friendId}`);
        }

        return res.status(201).json({ message: "Invitation envoyée avec succès" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur interne du serveur", error: error.message });
    }
}

/** * Accepter une invitation d'ami
 */
module.exports.acceptInvitation = async (req, res) => {
    try {
        const { requesterId } = req.body;
        const userId = req.userId;

        const relation = await UserRelation.findOne({
            where: {
                requesterId: requesterId,
                addresseeId: userId,
                status: "envoyée"
            }
        });
        if (!relation) {
            return res.status(404).json({ message: "Aucune invitation trouvée à accepter" });
        }

        // Créer une entrée dans la table userFollows pour les deux utilisateurs si elle n'existe pas déjà
        const existingFollow1 = await UserFollow.findOne({
            where: {
                followerId: userId,
                followingId: requesterId
            }
        });
        const existingFollow2 = await UserFollow.findOne({
            where: {
                followerId: requesterId,
                followingId: userId
            }
        });
        if (!existingFollow1) {
            await UserFollow.create({
                followerId: userId,
                followingId: requesterId
            });
        }
        if (!existingFollow2) {
            await UserFollow.create({
                followerId: requesterId,
                followingId: userId
            });
        }

        relation.status = "acceptée"; // Mettre à jour le statut à "acceptée"
        await relation.save();

        // NOTIFICATION + SOCKET (Acceptation)
        const io = req.app.get('io');
        const userAccepter = await Users.findByPk(userId);

        // Notif pour celui qui avait envoyé la demande
        const notif = await Notification.create({
            recipientId: requesterId,
            senderId: userId,
            type: 'accept',
            message: `${userAccepter.prenom} ${userAccepter.nom} a accepté votre invitation`,
            relatedId: userId
        });

        if (io) {
            // Emit pour mise à jour amis/followers réciproque
            io.emit('newFollow', { followerId: userId, followingId: requesterId });
            io.emit('newFollow', { followerId: requesterId, followingId: userId });

            io.emit('newNotification', {
                recipientId: requesterId,
                notification: {
                    id: notif.id,
                    type: 'accept',
                    message: notif.message,
                    sender: {
                        id: userAccepter.id,
                        nom: userAccepter.nom,
                        prenom: userAccepter.prenom,
                        photo: userAccepter.photo,
                        username: userAccepter.username
                    },
                    read: false,
                    createdAt: notif.createdAt
                }
            });
            console.log(`[Socket] Notification 'accept' sent to user ${requesterId}`);
        }

        return res.status(200).json({ message: "Invitation acceptée avec succès" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur interne du serveur", error: error.message });
    }
}

/** * Supprimer un ami
 */
module.exports.deleteFriend = async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.userId;

        const relation = await UserRelation.findOne({
            where: {
                [Op.or]: [
                    { requesterId: userId, addresseeId: friendId, status: "acceptée" },
                    { requesterId: friendId, addresseeId: userId, status: "acceptée" }
                ]
            }
        });

        if (!relation) {
            return res.status(404).json({ message: "Vous n'êtes pas amis avec cet utilisateur" });
        }
        await relation.destroy();

        await UserFollow.destroy({
            where: {
                [Op.or]: [
                    { followerId: userId, followingId: friendId },
                    { followerId: friendId, followingId: userId }
                ]
            }
        });

        // SOCKET Unfollow réciproque
        const io = req.app.get('io');
        if (io) {
            io.emit('unfollow', { followerId: userId, followingId: friendId });
            io.emit('unfollow', { followerId: friendId, followingId: userId });
        }

        return res.status(200).json({ message: "Ami supprimé avec succès" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur interne du serveur", error: error.message });
    }
}

/** * Refuser une invitation d'ami
 */
module.exports.refuseInvitation = async (req, res) => {
    try {
        const { requesterId } = req.body;
        const userId = req.userId;

        const relation = await UserRelation.findOne({
            where: {
                requesterId: requesterId,
                addresseeId: userId,
                status: "envoyée"
            }
        });

        if (!relation) {
            return res.status(404).json({ message: "Invitation introuvable" });
        }

        // Supprimer la relation pour permettre un renvoi ultérieur
        await relation.destroy();
        return res.status(200).json({ message: "Invitation refusée avec succès" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur interne du serveur", error: error.message });
    }
}

module.exports.blockUser = async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.userId;

        // Create block record
        const [block, created] = await UserBlock.findOrCreate({
            where: { blockerId: userId, blockedId: friendId },
            defaults: { blockerId: userId, blockedId: friendId }
        });

        if (!created) {
            return res.status(400).json({ message: "Utilisateur déjà bloqué" });
        }

        // Destroy friend relation if exists
        await UserRelation.destroy({
            where: {
                [Op.or]: [
                    { requesterId: userId, addresseeId: friendId },
                    { requesterId: friendId, addresseeId: userId }
                ]
            }
        });

        // Destroy follows
        await UserFollow.destroy({
            where: {
                [Op.or]: [
                    { followerId: userId, followingId: friendId },
                    { followerId: friendId, followingId: userId }
                ]
            }
        });

        // SOCKET Unfollow
        const io = req.app.get('io');
        if (io) {
            io.emit('unfollow', { followerId: userId, followingId: friendId });
            io.emit('unfollow', { followerId: friendId, followingId: userId });
        }

        return res.status(200).json({ message: "Utilisateur bloqué avec succès" });
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur", error: error.message });
    }
}

/** 
 * Débloquer un utilisateur
 */
module.exports.unblockUser = async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.userId;

        const deleted = await UserBlock.destroy({
            where: { blockerId: userId, blockedId: friendId }
        });

        if (!deleted) {
            return res.status(404).json({ message: "Cet utilisateur n'est pas bloqué" });
        }

        return res.status(200).json({ message: "Utilisateur débloqué avec succès" });
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur", error: error.message });
    }
}

/** 
 * Suivre un utilisateur
 * @param {*} req
 * @param {*} res
 */
module.exports.followUser = async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.userId;

        // Sécurité : pas de self-follow
        if (String(userId) === String(friendId)) {
            return res.status(400).json({ message: "Vous ne pouvez pas vous suivre vous-même" });
        }

        // Vérifier si relation existe déjà
        const existingFollow = await UserFollow.findOne({
            where: {
                followerId: userId,
                followingId: friendId
            }
        });

        if (existingFollow) {
            return res.status(400).json({ message: "Vous suivez déjà cet utilisateur" });
        }

        // Créer la relation
        await UserFollow.create({
            followerId: userId,
            followingId: friendId
        });

        // --- NOTIFICATION & SOCKET ---
        const io = req.app.get('io');
        const sender = await Users.findByPk(userId);

        // 1. Créer la notification en base
        const notif = await Notification.create({
            recipientId: friendId,
            senderId: userId,
            type: 'follow',
            message: `${sender.prenom} ${sender.nom} a commencé à vous suivre`,
            relatedId: userId
        });

        // 2. Emettre via Socket.io
        if (io) {
            // Event pour mettre à jour le compteur d'abonnés en temps réel
            io.emit('newFollow', {
                followerId: userId,
                followingId: friendId
            });

            // Event pour la notification
            io.emit('newNotification', {
                recipientId: friendId,
                notification: {
                    id: notif.id,
                    type: 'follow',
                    message: notif.message,
                    sender: {
                        id: sender.id,
                        nom: sender.nom,
                        prenom: sender.prenom,
                        photo: sender.photo,
                        username: sender.username
                    },
                    read: false,
                    createdAt: notif.createdAt
                }
            });
            console.log(`[Socket] Notification 'follow' sent to user ${friendId}`);
        }

        return res.status(200).json({ message: "Utilisateur suivi avec succès" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Erreur interne du serveur",
            error: error.message
        });
    }
}

/**
 * Ne plus suivre un utilisateur
 * @param {*} req
 * @param {*} res
 */
module.exports.unfollowUser = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const friendId = id;

        const follow = await UserFollow.findOne({
            where: {
                followerId: userId,
                followingId: friendId
            }
        });

        if (!follow) {
            return res.status(404).json({ message: "Relation inexistante" });
        }

        await follow.destroy();

        // SOCKET EMIT
        const io = req.app.get('io');
        if (io) {
            io.emit('unfollow', {
                followerId: userId,
                followingId: friendId
            });
        }

        return res.status(200).json({ message: "Désabonnement réussi" });

    } catch (error) {
        return res.status(500).json({
            message: "Erreur interne du serveur",
            error: error.message
        });
    }
}