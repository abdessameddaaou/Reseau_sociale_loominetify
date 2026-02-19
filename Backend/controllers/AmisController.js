const { UserRelation, UserFollow, Users } = require("../models");
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

        relation.status = "acceptée"; 
        await relation.save();
        await Promise.all([
            UserFollow.create({ followerId: userId, followingId: requesterId }),
            UserFollow.create({ followerId: requesterId, followingId: userId })
        ]);

        return res.status(200).json({ message: "Invitation acceptée, vous êtes maintenant amis" });
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

        relation.status = "refusée";
        await relation.save();

        return res.status(200).json({ message: "Invitation refusée" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erreur interne du serveur", error: error.message });
    }
}