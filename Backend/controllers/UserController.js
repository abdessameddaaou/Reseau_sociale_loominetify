const Users = require("../models/users");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");



// Récupérer tous les utilisateurs

module.exports.getAllUsers = async (req, res) => {
  try {
    const users =  await Users.findAll();
    res.json(users);
  } catch (error) {
    console.error({ error: "Erreur lors de la récupération des utilisateurs :" });
    res.status(500).json({ error: "Une erreur est survenue lors de la récupération des utilisateurs." });
  }
};

// Créer un nouvel utilisateur

module.exports.createUser = async (req, res) => {
  try {
    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const { nom, prenom, email, telephone, dateNaissance, question, reponse, ville, pays, isAdmin } = req.body;
    const password = req.body.password;
    
    const userExists = await Users.findOne({ where: { email: email } });
    if (userExists) {
      return res.status(400).json({ message: "Un utilisateur avec cet email existe déjà.", error: error.message });
    }

    if(dateNaissance > new Date()) {
      return res.status(400).json({
        message: "La date de naissance ne peut pas être dans le futur.", error: error.message        
      });
    }else if(dateNaissance > new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)) {
      return res.status(400).json({
        message: "Vous devez avoir au moins 18 ans pour vous inscrire", error: error.message
      });
    }
    if (!regexPassword.test(password)) {
    return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial." });
    }

    // Hasher le mot de passe 
    
    const cryptPassword = await bcrypt.hash(password, 10);

    // Send Email de confirmation (à implémenter)
    const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'elhilali.abdelouahab@gmail.com',
      pass: 'fikhmgcheswzhbft'
    }
  });

      const mailOptions = {
        from: 'elhilali.abdelouahab@gmail.com',
        to: req.body.email,
        subject: 'Bienvenue sur notre plateforme',
        text: `Bonjour ${req.body.prenom},\n\nMerci de vous être inscrit sur notre plateforme.`
      };

      transport.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.error("Erreur lors de l'envoi de l'email de bienvenue :", error);
        } else {
          const newUser = await Users.create({ nom, prenom, email, password: cryptPassword, telephone, dateNaissance, question, reponse, ville, pays, isAdmin });
          res.status(201).json({message: "Compte créé avec succès", data: newUser});
        }
      });
    

    
// res.status(201).json({message: "Compte créé avec succès", data: newUser});
    
  } catch (error) {
    res.status(500).json({ message: "Une erreur est survenue lors de la création de l'utilisateur.", error : error.message});
  } 
};
