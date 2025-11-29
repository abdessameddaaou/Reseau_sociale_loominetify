const jwt = require("jsonwebtoken");


/**
 * Vérification du token pour la sécurité du backend
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
module.exports.checkUser = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ message: "Non autorisé : aucun token trouvé." });
  }

  jwt.verify(token, "RANDOM_TOKEN_SECRET", async (err, decodedToken) => {
    if (err) {
      res.clearCookie("jwt");
      return res.status(401).json({ message: "Token invalide." });
    } else {
      req.userId = decodedToken.id;
      next();
    }
  });
};

/**
 * API pour vérifier le chemin côté front 
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
module.exports.UserConnecte = (req, res) =>{
  try {
    return res.status(200).json({ authenticated: true, userId: req.userId });
  } catch (error) {
    return res.status(500).json({ error: "Problème est servenue !" });
  }
}


