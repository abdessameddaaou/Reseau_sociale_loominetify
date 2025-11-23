const Users = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Création du token 
const createToken = (id) =>
  jwt.sign({ id }, "Teste", { expiresIn: "2h" });


// Connexion de l'utilisateur 
module.exports.loginUser = async (req, res) => {
  try {
    const user = await Users.findOne({
      where: { email: req.body.email }
    });
    if (user) {
      const passwordValide = await bcrypt.compare( req.body.password, user.password );
      if (!passwordValide) {
        console.log("ceci est un test =============================================")
        return res.status(401).json({error: "Le mot de passe ou l'adresse email est incorrect."});
      } else {

         try {
          const token = createToken(user.id);
          res.cookie("jwt", token, { httpOnly: true });
          return res.status(200).json({ token: token, message: "Connexion réussie"});
        } catch (error) {
          return res.status(500).json({ error: "Une erreur est survenue lors de la création du token." });
        }
      }
    } else {
      return res.status(401).json({ error: "Le mot de passe ou l'adresse email est incorrect." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Une erreur est survenue lors de la connexion." });
  }
}