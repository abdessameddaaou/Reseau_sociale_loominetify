const Users = require("../models/users");
const Publications = require('../models/publication');
const Commentaires = require('../models/commentaire');
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const config = require('../config');
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const UsersRelation = require("../models/userRelation");
const UserFollow = require("../models/userFollows");
const e = require("express");

/**
 * Création d'un token 
 * @param {*} id 
 * @returns 
 */
const createToken = (id) => jwt.sign({ id }, "RANDOM_TOKEN_SECRET", { expiresIn: "2h" });

    /**
     * Conf de transporteur
     */
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'loominetify@gmail.com', 
        pass: 'dqoe iemb gnfq azpa' 
      }
    }
);

/***
 * Fonction permet de générer le username
 */
const generateUsername = (prenom, nom) => {
  const cleanPrenom = prenom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
  const cleanNom = nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000); 
  return `@${cleanPrenom}.${cleanNom}${randomSuffix}`;
};

/**
 * Récupération de tous les utilisateurs
 * @param {*} req 
 * @param {*} res 
 */
module.exports.getAllUsers = async (req, res) => {
  try {
    const users =  await Users.findAll();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json(error.message);
  }
};


/**
 * Création d'un compte utilisdateur
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
module.exports.createUser = async (req, res) => {
  try {
    const regexPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const { nom, prenom, email, telephone, dateNaissance, question, reponse, ville, pays, isAdmin, password } = req.body;
    let username = generateUsername(prenom, nom);
    let checkUsername = await Users.findOne({ where: { username } });

      while (checkUsername) {
        username = generateUsername(prenom, nom);
       checkUsername = await Users.findOne({ where: { username } });
    }
    const userExists = await Users.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà.' });
    }

    const birthDate = new Date(dateNaissance);
    if (isNaN(birthDate.getTime())) {
      return res.status(400).json({ error: 'Date de naissance invalide.' });
    }
   
    const now = new Date();
    if (birthDate > now) {
      return res.status(400).json({ error: 'La date de naissance ne peut pas être dans le futur.' });
    }

    const eighteenYearsAgo = new Date( Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000 );
    if (birthDate > eighteenYearsAgo) {
      return res.status(400).json({ error: 'Vous devez avoir au moins 18 ans pour vous inscrire.' });
    }

    if (!regexPassword.test(password)) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'});
    }

    const cryptPassword = await bcrypt.hash(password, 10);

    const tokenConfirmation = createToken(email);
    const verificationLink = `${config.frontendBaseUrl}/activation-compte/${tokenConfirmation}`;
     
    const htmlEmail = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Confirmation de compte</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f5f7fa;
        margin: 0;
        padding: 0;
      }

      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 12px;
        padding: 30px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
        border: 1px solid #e5e7eb;
      }

      .header {
        text-align: center;
        padding-bottom: 20px;
        border-bottom: 1px solid #eee;
      }

      .header h1 {
        font-size: 24px;
        color: #5b7cff;
        margin: 0;
        text-transform: lowercase;
      }

      .content {
        font-size: 15px;
        color: #333;
        line-height: 1.6;
        padding: 20px 0;
      }

      .btn {
        display: inline-block;
        background: linear-gradient(135deg, #5b7cff, #8b5cf6);
        color: #fff !important;
        padding: 12px 28px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
        margin: 25px 0;
      }

      .footer {
        text-align: center;
        font-size: 12px;
        color: #777;
        padding-top: 20px;
        border-top: 1px solid #eee;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="header">
        <h1>loominetify</h1>
      </div>

      <div class="content">
        <p>
          Bonjour <strong>${prenom}</strong>,<br /><br/>
          Merci de vous être inscrit sur <strong>Loominetify</strong> 🎉<br />
          Pour finaliser votre inscription, veuillez confirmer votre adresse email en
          cliquant sur le bouton ci-dessous :
        </p>

        <div style="text-align:center;">
          <a href="${verificationLink}" class="btn" target="_blank" rel="noopener noreferrer">
            Confirmer mon compte
          </a>
        </div>

        <p>
          Si vous n’êtes pas à l’origine de cette inscription, vous pouvez ignorer cet
          email en toute sécurité.
        </p>
      </div>
    </div>
  </body>
</html>`;

    const mailOptions = {
      from: 'loominetify@gmail.com',
      to: email,
      subject: 'Bienvenue sur Loominetify - Confirmez votre compte',
      html: htmlEmail
    };
    
    await Users.create({ nom, prenom, username, email, password: cryptPassword, telephone, dateNaissance: birthDate, question, reponse, ville, pays, isAdmin });
    
        await transport.sendMail(mailOptions);
        
    return res.status(201).json({ message: 'Compte créé avec succès. Veuillez vérifier votre email.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};



/**
 * Activation du compte utilisateur 
 */
module.exports.activerCompteUser = async( req, res ) =>{
  try {

    const user = await Users.findOne({where: {email: req.body.id }})    
    await user.set({compteActive: true})
    await user.save()

    const verificationLink = `${config.frontendBaseUrl}/auth`
        const htmlEmail = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Compte activé avec succès</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f5f7fa;
        margin: 0;
        padding: 0;
      }

      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 12px;
        padding: 30px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
        border: 1px solid #e5e7eb;
      }

      .header {
        text-align: center;
        padding-bottom: 20px;
        border-bottom: 1px solid #eee;
      }

      .header h1 {
        font-size: 24px;
        color: #5b7cff;
        margin: 0;
        text-transform: lowercase;
      }

      .content {
        font-size: 15px;
        color: #333;
        line-height: 1.6;
        padding: 20px 0;
      }

      .btn {
        display: inline-block;
        background: linear-gradient(135deg, #5b7cff, #8b5cf6);
        color: #fff !important;
        padding: 12px 28px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
        margin: 25px 0;
      }

      .footer {
        text-align: center;
        font-size: 12px;
        color: #777;
        padding-top: 20px;
        border-top: 1px solid #eee;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="header">
        <h1>loominetify</h1>
      </div>

      <div class="content">
        <p>
          Votre compte a été <strong>confirmé avec succès</strong> 🎉<br />
          Nous vous souhaitons de très bons moments sur notre réseau social.<br /><br/>
          Vous pouvez dès maintenant vous connecter en cliquant sur le bouton ci-dessous :
        </p>

        <div style="text-align:center;">
          <a href="${verificationLink}" class="btn" target="_blank" rel="noopener noreferrer">
            Se connecter
          </a>
        </div>
      </div>
    </div>
  </body>
</html>`;

    const mailOptions = {
      from: 'loominetify@gmail.com',
      to: user.email,
      subject: 'Votre compte Loominetify est activé ✅',
      html: htmlEmail
    };
    
    await transport.sendMail(mailOptions);

    return res.status(201).json({message: "Compte activé avec succès"});
    
  } catch (error) {
    return res.status(500).json({error: "Une erreur est survenue lors de l'activation de votre compte"})
  }
}

/**
 * Récupération des informations du user connecté
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
module.exports.getUserConnecte = async (req, res) => {
  try {
    const user = await Users.findByPk(req.userId, {
      attributes: { exclude: ['password', 'reponse', 'question'] },
      include: [
        {
          model: UsersRelation,
          as: 'sentRelations',
        },
        {
          model: UsersRelation,
          as: 'receivedRelations',
        },
        {
          model: Users,
          as: 'followers', // 👈 abonnés
          attributes: ['id', 'nom', 'prenom', 'email'],
          through: { attributes: [] }, // pas besoin de UserFollow dans la réponse
        },
        {
          model: Users,
          as: 'following', // 👈 abonnés
          attributes: ['id', 'nom', 'prenom', 'email'],
          through: { attributes: [] }, // pas besoin de UserFollow dans la réponse
        },
      ],
    });
    return res.status(200).json({ user });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Récupération des informations d'un utilisateur passé en paramètre
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
module.exports.getUser = async(req, res) =>{
  try {
    const user = await Users.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'reponse', 'question'] },
      include: [
        {
          model: UsersRelation,
          as: 'sentRelations',
        },
        {
          model: UsersRelation,
          as: 'receivedRelations',
        },
        {
          model: Users,
          as: 'followers', // 👈 abonnés
          attributes: ['id', 'nom', 'prenom', 'email'],
          through: { attributes: [] }, // pas besoin de UserFollow dans la réponse
        },
        {
          model: Users,
          as: 'following', // 👈 abonnés
          attributes: ['id', 'nom', 'prenom', 'email'],
          through: { attributes: [] }, // pas besoin de UserFollow dans la réponse
        },
      ],
    })
    return res.status(200).json({user: user});
    
  } catch (error) {
    return res.status(500).json({error: "Un problème est servenu lors de la récupération d'un utilisateur "})
  }
}

/**
 * Mise à jour des informations de l'utilisateur
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
module.exports.UpdateInformationsUser = async(req, res) =>{
  try {

    const user = await Users.findByPk(req.userId);
    const fields = [
      'nom', 'prenom', 'telephone', 'dateNaissance', 
      'ville', 'pays', 'photo', 'bio', 'siteweb', 
      'profession', 'relationStatus', 'hashtags'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();
    return res.status(201).json({ message: 'success', user });
  } catch (error) {
    return res.status(500).json({error: "Un problème est servenu lors de la modification des informations de l'utilisateur "})
  }
}



/**
 * Récupération de tout les utilisateurs avec la recherche 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
module.exports.getAllUsersSearch = async(req, res) =>{
  try {
    const { term } = req.query;
    if (!term) {
        return res.status(200).json({ users: [] });
    }
    const user = await Users.findAll({
      attributes: ['id', 'nom', 'prenom', 'username', 'photo'],
      where: {
        [Op.or]: [
          { nom: { [Op.like]: `%${term}%` } },
          { prenom: { [Op.like]: `%${term}%` } },
          { username: { [Op.like]: `%${term}%` } }
        ]
      },
      limit: 10
    })
    return res.status(201).json({ message: 'success', user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}