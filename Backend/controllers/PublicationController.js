const e = require('express');
const Publications = require('../models/publication');
const jwt = require("jsonwebtoken");
const { or } = require('sequelize');
const Users = require('../models/users');
const Commentaire = require('../models/commentaire');
const checkUser = require('../controllers/Middleware').checkUser;


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
        }]
      }));
    return res.status(200).json(publications);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports.getAllPublicationsUserConnecter = async(req, res) => {
  try {

    const user = req.userId
    const publications = await Publications.findAll({
      where: { userId: user },
      order: [['createdAt', 'DESC']], 
      include: [{
        model: Commentaire,
        as: 'Commentaires',
        attributes: ['id', 'contenu', 'image', 'nombreLikes']
      }] 
    });
    
    const countComments = await Commentaire.count({
      
    })


    return res.status(200).json(publications);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}