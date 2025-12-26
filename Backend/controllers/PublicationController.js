const e = require('express');
const Publications = require('../models/publication');
const jwt = require("jsonwebtoken");
const { or } = require('sequelize');
const Users = require('../models/users');
const Commentaire = require('../models/commentaire');
const checkUser = require('../controllers/Middleware').checkUser;
const Interactions = require('../models/interaction');

/** 
 * Création d'une publication
 * @param {*} req 
 * @param {*} res   
 */
module.exports.createPublication = async (req, res) => {
  try {

    /**
     * Création de la publication
     */
    const newPublication = await Publications.create({
      description: req.body.text,
      image: req.file ? req.file.filename : null,
      video: null,
      userId: req.userId
    });

    /**
     * Récupération ds informations pour envoyer au websocket
     */
    const completePub = await Publications.findByPk(newPublication.id, {
      include: [
        { model: Users, as: 'user', attributes: ['id', 'nom', 'prenom', 'photo'] },
        { model: Commentaire, as: 'comments' }, 
        { model: Interactions, as: 'interactions' }
      ]
    });

    /**
     * Enoyer la publication au websocket avec l'event ' new_publication '
     */
    const io = req.app.get("io");
    if (io) {
      io.emit("new_publication", completePub);
    }
    return res.status(201).json(completePub);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Récupération de tous les publications
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
module.exports.getAllPublications = async (req, res) => {
  try {
    const publications = (await Publications.findAll({ 
        order: [['createdAt', 'DESC']],
        include: [{
          model: Users,
          as: 'user',
          attributes: ['id', 'nom', 'prenom', 'photo']
        },
        {
          model: Commentaire,
          as: 'comments',
          attributes: ['id', 'contenu', 'userId', 'publicationId','contenu','createdAt', 'image', 'nombreLikes'],
          include: [{
            model: Users,
            as: 'user',
            attributes: ['id', 'nom', 'prenom', 'photo']
          }]
        },
        {
          model: Interactions,
          as: 'interactions',
          attributes: ['id', 'type', 'userId', 'publicationId']
        },
        {
          model: Publications,
          as: 'sharedPublication',
          include: [{
            model: Users,
            as: 'user',
            attributes: ['id', 'nom', 'prenom', 'photo']
          } ]
        }
      ]
      }));
    return res.status(200).json(publications);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
module.exports.likePublication = async (req, res) => {
  try {
    const publicationId = req.params.id;
    const userId = req.userId;
    const { like } = req.body;

    if (typeof like !== 'boolean') {
      return res.status(400).json({ error: "Valeur 'like' invalide" });
    }

    const publication = await Publications.findByPk(publicationId);
    if (!publication) {
      return res.status(404).json({ error: "Publication non trouvée." });
    }

    if (like === true) {
      // éviter doublon
      const alreadyLiked = await Interactions.findOne({
        where: { userId, publicationId }
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
        where: { userId, publicationId }
      });

      if (deleted) {
        publication.nombreLikes -= 1;
      }
    }

    await publication.save();

    return res.status(200).json({
      liked: like,
      likes: publication.nombreLikes
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
module.exports.addCommentToPublication = async (req, res) => {
  try {
    const commentText = req.body.text;

    if(!commentText && !req.file) {
      return res.status(400).json({ error: "Le commentaire doit contenir du texte ou une image" });
    }

    const publication = await Publications.findByPk(req.params.id);
    if (!publication) {
      return res.status(404).json({ error: "Publication non trouvée." });
    }

     const newCommentaire = await Commentaire.create({
      contenu: commentText,
      userId: req.userId,
      publicationId: req.params.id,
      image:  req.file ? req.file.filename : null
    });

    const commentaireComplet= await Commentaire.findByPk(newCommentaire.id,{
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
 *  récupération de mes publications et commentaires
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
module.exports.getAllPublicationsUserConnecter = async(req, res) => {
  try {

    const user = req.userId
    const publications = await Publications.findAll({
      where: { userId: user },
      order: [['createdAt', 'DESC']], 
      include: [{
        model: Commentaire,
        as: 'comments',
        attributes: ['id', 'contenu', 'image', 'nombreLikes', 'createdAt', 'userId'],
          include: [{
            model: Users,
            as: 'user',
            attributes: ['id', 'nom', 'prenom', 'photo']
          }]
      }] 
    });
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
 * @param {*} req 
 * @param {*} res   
 */
module.exports.likeComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.userId;
    const comment = await Commentaire.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Commentaire non trouvé." });
    }
    comment.nombreLikes += 1;
    const updatedComment = await comment.save();  
    return res.status(200).json({ message: "Commentaire liké avec succès.", nombreLikes: updatedComment.nombreLikes });   
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
/** * Suppression d'un commentaire
 * @param {*} req 
 * @param {*} res   
 */
module.exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;

    const comment = await Commentaire.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Commentaire non trouvé." });
    }
    await comment.destroy();
    return res.status(200).json({ message: "Commentaire supprimé avec succès." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/** * Récupérer les utilisateurs ayant liké une publication
 * @param {*} req 
 * @param {*} res   
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
 * @param {*} req 
 * @param {*} res
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
    const users = commentaires.map(commentaire => commentaire.user);
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}


/** * Récupérer les utilisateurs ayant partagé une publication
 * @param {*} req 
 * @param {*} res
 */
module.exports.getUsersWhoSharedPost = async (req, res) => {
  try {
    const publicationId = req.params.id;

    const sharedPublications = await Publications.findAll({
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
* @param {*} req 
* @param {*} res   
*/
module.exports.sharePublication = async (req, res) => {
  try {
    const publicationId = req.params.id;
    const userId = req.userId;
    const originalPublication = await Publications.findByPk(publicationId);
    if (!originalPublication) {
      return res.status(404).json({ error: "Publication originale non trouvée." });
    }
    const sharedPublication = await Publications.create({
      description: originalPublication.description,
      image: originalPublication.image,
      video: originalPublication.video,
      userId: userId,
      sharedPublicationId: originalPublication.id,
      commentairePartage: req.body.commentairePartage || null
    });

    originalPublication.nombrePartages += 1;
    await originalPublication.save();

    return res.status(201).json({ message: "Publication partagée avec succès.", publication: sharedPublication });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } 
};
