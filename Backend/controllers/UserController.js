const Users = require("../models/users");


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

// module.exports.createUser = async (req, res) => {
//   try {
//     const { nom, prenom, email, password, telephone, dateNaissance } = req.body;
//     const newUser = await Users.create({ nom, prenom, email, password, telephone, dateNaissance });
//     res.status(201).json(newUser);
//   } catch (error) {
//     console.error("Erreur lors de la création de l'utilisateur :", error);
//     res.status(500).json({ error: "Une erreur est survenue lors de la création de l'utilisateur." });
//   } 
// };
