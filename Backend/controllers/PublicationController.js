const e = require('express');
const Publications = require('../models/publication');
const jwt = require("jsonwebtoken");
const { or } = require('sequelize');
const Users = require('../models/users');
const checkUser = require('../controllers/Middleware').checkUser;
const Interactions = require('../models/interaction');
const Commentaire = require('../models/commentaire');

/** * Création d'une publication
 * @param {*} req 
 * @param {*} res   
 */
module.exports.createPublication = async (req, res) => {
  try {
    let userId = null;

    await checkUser(req, res, () => {
      userId = req.userId;
    });

    const description = req.body.text;        // texte du FormData
    const imagePath = req.file ? req.file.filename : null; // image reçue par multer

    const newPublication = await Publications.create({
      description,
      image: imagePath,
      video: null,
      userId
    });

    return res.status(201).json(newPublication);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

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


module.exports.likePublication = async (req, res) => {
  try {
    // À implémenter : ajouter une interaction de type 'like' pour la publication donnée par l'utilisateur connecté
    const publicationId = req.params.id;
    const userId = req.userId;
    const likeOrDislike = req.body.like; // true pour like, false pour dislike
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
