const Users = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const createToken = (id) =>
  jwt.sign({ id }, "Teste", { expiresIn: "2h" });

module.exports.loginUser = async (req, res) => {
  try {
    const user = await Users.findOne({
      where: { email: req.body.email }
    });
    if (user) {
      const passwordValide = await bcrypt.compare( req.body.password, user.password );
      if (passwordValide) {
        try {
         
          const token = createToken(user.id);
          res.cookie("jwt", token, { httpOnly: true });
          res.status(200).json({ token: token, message: "Connexion réussie"});
        } catch (error) {
          res.status(500).json({ error: "Une erreur est survenue lors de la création du token." });
        }
      } else {
        res.status(401).json({ error: "Le mot de passe ou l'adresse email est incorrect." });
      }
    } else {
      res.status(401).json({ error: "Le mot de passe ou l'adresse email est incorrect." });
    }
  } catch (error) {
    res.status(500).json({ error: "Une erreur est survenue lors de la connexion." });
  }
};


// router.post("/logout", AuthentificationController.logoutUser);
// router.post("/forgotpassword", AuthentificationController.forgotPasswordUser);
// router.post("/resetpassword", AuthentificationController.resetPasswordUser);
