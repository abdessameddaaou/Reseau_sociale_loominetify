const Users = require("../models/users");
const bcrypt = require("bcrypt");

// Récupérer tous les utilisateurs

module.exports.getAllUsers = async (req, res) => {
  try {
    const users =  await Users.findAll();
    res.json(users);
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs :", error);
    res.status(500).json({ error: "Une erreur est survenue lors de la récupération des utilisateurs." });
  }
};

// Créer un nouvel utilisateur

module.exports.createUser = async (req, res) => {
  try {
    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const { nom, prenom, email, telephone, dateNaissance, question, reponse, ville, pays, isAdmin } = req.body;
    const password = req.body.password;

    if (!regexPassword.test(password)) {
    return res.status(400).json({
      error: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial."
    });
    }

    // Hasher le mot de passe 
    
    const cryptPassword = await bcrypt.hash(password, 10);
    const newUser = await Users.create({ nom, prenom, email, password: cryptPassword, telephone, dateNaissance, question, reponse, ville, pays, isAdmin });
    res.status(201).json({message: "Compte créé avec succès", data: newUser});
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur :", error);
    res.status(500).json({ error : error.message});
  } 
};
