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
       
        relation.status = 2; // Mettre à jour le statut à "acceptée"
        await relation.save();
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
        await relation.destroy();
        // relation.status = "refusée";
        // await relation.save();
        return res.status(200).json({ message: "Invitation refusée avec succès" });
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur", error: error.message });
    }
}

module.exports.blockUser = async (req, res) => {
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
        return res.status(200).json({ message: "Utilisateur bloqué avec succès" });
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur", error: error.message });        
    }
}
/** 
 * Débloquer un utilisateur (A COMPLETER)
 * @param {*} req
 * @param {*} res
 */
module.exports.unblockUser = async (req, res) => {
    try {
        const { friendId } = req.body;  
    } catch (error) {
        return res.status(500).json({ message: "Erreur interne du serveur", error: error.message });        
    }
}

/** 
 * Suivre un utilisateur (A COMPLETER)
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

    return res.status(200).json({ message: "Utilisateur suivi avec succès" });

  } catch (error) {
    return res.status(500).json({
      message: "Erreur interne du serveur",
      error: error.message
    });
  }
}

/**
 * Ne plus suivre un utilisateur (A COMPLETER)
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

    return res.status(200).json({ message: "Désabonnement réussi" });

  } catch (error) {
    return res.status(500).json({
      message: "Erreur interne du serveur",
      error: error.message
    });
  }
}

 