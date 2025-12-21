const e = require('express');
const Publications = require('../models/publication');
const jwt = require("jsonwebtoken");
const { or } = require('sequelize');
const Users = require('../models/users');
const Commentaire = require('../models/commentaire');
const checkUser = require('../controllers/Middleware').checkUser;
const Interactions = require('../models/interaction');

/** * Création d'une publication
 * @param {*} req 
 * @param {*} res   
 */
module.exports.createPublication = async (req, res) => {
  try {
    let userId = req.userId;
    const description = req.body.text;        // texte du FormData
    const imagePath = req.file ? req.file.filename : null; // image reçue par multer

    const newPublication = await Publications.create({
      description,
      image: imagePath,
      video: null,
      userId
    });

    const io = req.app.get('io');
    if (io) io.emit('post:created', newPublication);

    return res.status(201).json(newPublication);

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
          attributes: ['id', 'contenu', 'userId', 'publicationId','contenu','createdAt'],
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
        }]
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
    // À implémenter : ajouter une interaction de type 'like' pour la publication donnée par l'utilisateur connecté
    const publicationId = req.params.id;
    const userId = req.userId;
    const likeOrDislike = req.body.like;
    const publication = await Publications.findByPk(publicationId);
    if (!publication) {
      return res.status(404).json({ error: "Publication non trouvée." });
    }
    if(likeOrDislike == false){
      publication.nombreLikes -= 1;
      const interaction = await Interactions.destroy({
        where: {
          userId: userId,
          publicationId: publicationId
        }
      });
    }else{
      publication.nombreLikes += 1;
      const interaction = await Interactions.create({
      type: 'like',
      userId: userId,
      publicationId: publicationId
    });
    }
    const updatedPublication = await publication.save();

    return res.status(200).json({ message: "Like Or disLike saved" });
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
module.exports.addCommentToPublication = async (req, res) => {
  try {
    const publicationId = req.params.id;
    const userId = req.userId;
    const commentText = req.body.text;

    if(!commentText && !req.file) {
      return res.status(400).json({ error: "le commentaire doit contenir du texte ou une image" });
    }
    const publication = await Publications.findByPk(publicationId);
    if (!publication) {
      return res.status(404).json({ error: "Publication non trouvée." });
    }

    const imagePath = req.file ? 'uploads/comments/' + req.file.filename : null;

    await Commentaire.create({
      contenu: commentText,
      userId: userId,
      publicationId: publicationId,
      image: imagePath
    });

    return res.status(201).json({ message: "Commentaire ajouté avec succès." });
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
};
