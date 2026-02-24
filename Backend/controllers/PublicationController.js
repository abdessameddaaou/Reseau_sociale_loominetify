const { Publication, Users, Commentaire, Interactions } = require('../models');
const jwt = require("jsonwebtoken");

/** * Création d'une publication
 */
module.exports.createPublication = async (req, res) => {
  try {
    const newPublication = await Publication.create({
      description: req.body.text,
      image: req.file ? req.file.filename : null,
      video: null,
      userId: req.userId,
      visibility: req.body.visibility || 'public'
    });

    /**
     * Récupération des informations pour envoyer au websocket
     */
    const completePub = await Publication.findByPk(newPublication.id, {
      include: [
        { model: Users, as: 'user', attributes: ['id', 'nom', 'prenom', 'photo'] },
        { model: Commentaire, as: 'comments' },
        { model: Interactions, as: 'reactions' }
      ]
    });

    /**
     * Envoyer la publication au websocket avec l'event 'new_publication'
     */
    const io = req.app.get("io");
    if (io) {
      io.emit("new_publication", completePub);
    }
    return res.status(201).json(completePub);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Récupération des publications du feed (abonnements + amis + mes propres posts)
 */
module.exports.getAllPublications = async (req, res) => {
  try {
    const userId = req.userId;
    const { UserFollow } = require('../models');
    const { Op } = require('sequelize');

    // Récupérer les IDs des utilisateurs que je suis (abonnements)
    const followRows = await UserFollow.findAll({
      where: { followerId: userId },
      attributes: ['followingId']
    });
    const followingIds = followRows.map(f => f.followingId);

    // Mes abonnements + moi-même
    const allIds = [userId, ...followingIds];

    const publications = await Publication.findAll({
      where: {
        userId: { [Op.in]: allIds },
        [Op.or]: [
          { visibility: 'public' },
          { userId: userId } // Je peux voir mes propres posts privés
        ]
      },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'nom', 'prenom', 'photo']
        },
        {
          model: Commentaire,
          as: 'comments',
          include: [{
            model: Users,
            as: 'user',
            attributes: ['id', 'nom', 'prenom', 'photo']
          }]
        },
        {
          model: Interactions,
          as: 'reactions',
          attributes: ['id', 'type', 'userId', 'publicationId']
        },
        {
          model: Publication,
          as: 'sharedPublication',
          include: [{
            model: Users,
            as: 'user',
            attributes: ['id', 'nom', 'prenom', 'photo']
          }]
        }
      ]
    });
    return res.status(200).json(publications);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Liker / Unliker une publication
 */
module.exports.likePublication = async (req, res) => {
  try {
    const publicationId = req.params.id;
    const userId = req.userId;
    const { like } = req.body;
    if (typeof like !== 'boolean') {
      return res.status(400).json({ error: "Valeur 'like' invalide" });
    }

    const publication = await Publication.findByPk(publicationId);
    if (!publication) {
      return res.status(404).json({ error: "Publication non trouvée." });
    }

    if (like === true) {

      const alreadyLiked = await Interactions.findOne({
        where: { userId, publicationId, type: 'like' }
      });

      if (!alreadyLiked) {
        await Interactions.create({
          type: 'like',
          userId,
          publicationId
        });
        publication.nombreLikes += 1;
      }
    } else {

      const deleted = await Interactions.destroy({
        where: { userId, publicationId, type: 'like' }
      });

      if (deleted) {
        publication.nombreLikes -= 1;
      }
    }

    await publication.save();

    const io = req.app.get("io")
    if (io) {
      io.emit("post_like_updated", {
        publicationId: publication.id,
        likesCount: publication.nombreLikes,
        userId,
        liked: like
      })
    }

    return res.status(200).json({
      liked: like,
      likes: publication.nombreLikes,
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Ajouter un commentaire
 */
module.exports.addCommentToPublication = async (req, res) => {
  try {
    const commentText = req.body.text;

    if (!commentText && !req.file) {
      return res.status(400).json({ error: "Le commentaire doit contenir du texte ou une image" });
    }

    const publication = await Publication.findByPk(req.params.id);
    if (!publication) {
      return res.status(404).json({ error: "Publication non trouvée." });
    }

    const newCommentaire = await Commentaire.create({
      contenu: commentText,
      userId: req.userId,
      publicationId: req.params.id,
      image: req.file ? req.file.filename : null
    });

    const commentaireComplet = await Commentaire.findByPk(newCommentaire.id, {
      include: [{ model: Users, as: 'user', attributes: ['id', 'nom', 'prenom', 'photo'] }]
    })

    const io = req.app.get("io");
    if (io) {
      io.emit("new_comment", {
        publicationId: Number(req.params.id),
        comment: commentaireComplet
      });
    }
    return res.status(201).json(commentaireComplet);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Récupération de mes publications et commentaires
 */
module.exports.getAllPublicationsUserConnecter = async (req, res) => {
  try {
    const user = req.userId
    const publications = await Publication.findAll({
      where: { userId: user },
      order: [['createdAt', 'DESC']],
      include: [{
        model: Commentaire,
        as: 'comments',
        include: [{
          model: Users,
          as: 'user',
          attributes: ['id', 'nom', 'prenom', 'photo']
        }]
      }]
    });

    // Ajout d'un attribut "mine" pour le front
    const data = publications.map((p) => {
      const pub = p.toJSON();
      pub.comments = (pub.comments || []).map((c) => ({
        ...c,
        mine: c.userId === user,
      }));
      return pub;
    });

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/** * Liker un commentaire
 */
module.exports.likeComment = async (req, res) => {
  try {
    const comment = await Commentaire.findByPk(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Commentaire non trouvé." });
    }

    comment.nombreLikes += 1;
    const updatedComment = await comment.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("comment_like_updated", {
        commentId: updatedComment.id,
        publicationId: comment.publicationId,
        likesCount: updatedComment.nombreLikes,
        userId: req.userId
      });
    }

    return res.status(200).json({ message: "Commentaire liké avec succès.", nombreLikes: updatedComment.nombreLikes });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/** * Suppression d'un commentaire
 */
module.exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;

    const comment = await Commentaire.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Commentaire non trouvé." });
    }
    const publicationId = comment.publicationId;

    if (comment.userId !== req.userId) {
      // Tu peux activer ça si tu veux bloquer la suppression par les autres
      // return res.status(403).json({ error: "Non autorisé" });
    }

    await comment.destroy();

    const io = req.app.get("io");
    if (io) {
      io.emit("delete_comment", {
        commentId,
        publicationId,
      })
    }

    return res.status(200).json({ message: "Commentaire supprimé avec succès." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/** * Récupérer les utilisateurs ayant liké une publication
 */
module.exports.getUsersWhoLikedPost = async (req, res) => {
  try {
    const publicationId = req.params.id;

    const interactions = await Interactions.findAll({
      where: { publicationId, type: 'like' },
      include: [{
        model: Users,
        as: 'user',
        attributes: ['id', 'nom', 'prenom', 'photo']
      }]
    });
    const users = interactions.map(interaction => interaction.user);
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/** * Récupérer les utilisateurs ayant commenté une publication
 */
module.exports.getUsersWhoCommentedPost = async (req, res) => {
  try {
    const publicationId = req.params.id;

    const commentaires = await Commentaire.findAll({
      where: { publicationId },
      include: [{
        model: Users,
        as: 'user',
        attributes: ['id', 'nom', 'prenom', 'photo']
      }]
    });
    // On utilise un Set pour éviter les doublons si un user commente 2 fois
    const uniqueUsers = [];
    const map = new Map();
    for (const item of commentaires) {
      if (!map.has(item.user.id)) {
        map.set(item.user.id, true);
        uniqueUsers.push(item.user);
      }
    }

    return res.status(200).json({ users: uniqueUsers });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/** * Récupérer les utilisateurs ayant partagé une publication
 */
module.exports.getUsersWhoSharedPost = async (req, res) => {
  try {
    const publicationId = req.params.id;

    const sharedPublications = await Publication.findAll({
      where: { sharedPublicationId: publicationId },
      include: [{
        model: Users,
        as: 'user',
        attributes: ['id', 'nom', 'prenom', 'photo']
      }]
    });
    const users = sharedPublications.map(shared => shared.user);
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/** * Partager une publication 
*/
module.exports.sharePublication = async (req, res) => {
  try {
    const publicationId = Number(req.params.id);
    const userId = req.userId;

    const originalPublication = await Publication.findByPk(publicationId);
    if (!originalPublication) {
      return res.status(404).json({ error: "Publication originale non trouvée." });
    }

    const sharedPublication = await Publication.create({
      description: originalPublication.description,
      image: originalPublication.image,
      video: originalPublication.video,
      userId,
      sharedPublicationId: originalPublication.id,
      commentairePartage: req.body.commentairePartage || null
    });

    originalPublication.nombrePartages += 1;
    const updatedPost = await originalPublication.save();

    const completeShared = await Publication.findByPk(sharedPublication.id, {
      include: [
        { model: Users, as: 'user', attributes: ['id', 'nom', 'prenom', 'photo'] },
        {
          model: Commentaire,
          as: 'comments',
          include: [{ model: Users, as: 'user', attributes: ['id', 'nom', 'prenom', 'photo'] }]
        },
        { model: Interactions, as: 'reactions' },
        {
          model: Publication,
          as: 'sharedPublication',
          include: [
            { model: Users, as: 'user', attributes: ['id', 'nom', 'prenom', 'photo'] },
            { model: Interactions, as: 'reactions' }
          ]
        }
      ]
    });

    const io = req.app.get("io");
    if (io) {
      io.emit("new_publication", completeShared);
      io.emit("post_share_updated", {
        publicationId: originalPublication.id,
        sharesCount: updatedPost.nombrePartages
      });
    }

    return res.status(201).json(completeShared);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};