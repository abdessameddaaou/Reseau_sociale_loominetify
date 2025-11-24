const Users = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * Création du token 
 * @param {*} id 
 * @returns 
 */
const createToken = (id) => jwt.sign({ id }, "RANDOM_TOKEN_SECRET", { expiresIn: "2h" });

/**
 * Connexion de l'utilisateur 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
module.exports.loginUser = async (req, res) => {
  try {
    const user = await Users.findOne({
      where: { email: req.body.email }
    });
    if (user) {
      const passwordValide = await bcrypt.compare( req.body.password, user.password );
      if (!passwordValide) {
        return res.status(401).json({error: "Le mot de passe ou l'adresse email est incorrect."});
      }else if(!user.compteActive){
        return res.status(401).json({error: "Veuillez confirmer votre compte !! "});
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

/**
 * Déconnexion de l'utilisateur
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
module.exports.logoutUser = (req, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
    });

    return res.status(200).json({ message: "La déconnexion a bien été effectuée" });
  } catch (error) {
    return res.status(500).json({ error: "Une erreur est survenue lors de la déconnexion." });
  }
};
