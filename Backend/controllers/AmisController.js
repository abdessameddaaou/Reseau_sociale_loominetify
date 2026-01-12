const UserFollow = require("../models/userFollows");
const UserRelation = require("../models/userRelation");
const Users = require("../models/users");


/** 
 * Envoyer une invitation d'ami
 * @param {*} req 
 * @param {*} res   
 */
module.exports.sendInvitation = async (req, res) => {
    try {
        const { friendId } = req.body;
        const user = await Users.findByPk(req.userId);
        const friend = await Users.findByPk(friendId);

        if (!user || !friend) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Vérifier si l'invitation a déjà été envoyée
        const existingInvitation = await UserRelation.findOne({
            $or: [
                { user: req.userId, friend: friendId },
                { user: friendId, friend: req.userId }
            ]
        });

        if (existingInvitation) {
            return res.status(400).json({ message: "Invitation déjà envoyée" });
        }

        // Créer une nouvelle relation d'ami
        const newRelation = await UserRelation.create({
            requesterId: req.userId,
            addresseeId: friendId,
            status: "envoyée"
        });

        await newRelation.save();
        return res.status(201).json({ message: "Invitation envoyée avec succès" });
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur", error: error.message });
    }
}

/** 
 * Accepter une invitation d'ami
 * @param {*} req
 * @param {*} res
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
            return res.status(404).json({ message: "Invitation non trouvée" });
        }

        relation.status = 2; // Mettre à jour le statut à "acceptée"
        await relation.save();

        // Créer une entrée dans la table userFollows pour les deux utilisateurs
        await UserFollow.create({
            followerId: userId,
            followingId: requesterId
        });

        await UserFollow.create({
            followerId: requesterId,
            followingId: userId
        });

        return res.status(200).json({ message: "Invitation acceptée avec succès" });
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur", error: error.message });
    }
}

/** 
 * Supprimer un ami
 * @param {*} req
 * @param {*} res
 */
module.exports.deleteFriend = async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.userId;
        const relation = await UserRelation.findOne({
            where: {
            $or: [  
                { requesterId: userId, addresseeId: friendId, status: "acceptée" },
                { requesterId: friendId, addresseeId: userId, status: "acceptée" }
            ]
            }
        }); 
        if (!relation) {
            return res.status(404).json({ message: "Relation d'ami non trouvée" });
        }
        await relation.destroy();
        await UserFollow.destroy({
            where: {
                followerId: userId,
                followingId: friendId
            }
        });
        await UserFollow.destroy({
            where: {
                followerId: friendId,
                followingId: userId
            }
        });
        return res.status(200).json({ message: "Ami supprimé avec succès" });
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur", error: error.message });
    }
}

/** 
 * Refuser une invitation d'ami
 * @param {*} req
 * @param {*} res
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
            return res.status(404).json({ message: "Invitation non trouvée" });
        }

        relation.status = "refusée";
        await relation.save();
        return res.status(200).json({ message: "Invitation refusée avec succès" });
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur", error: error.message });
    }
}