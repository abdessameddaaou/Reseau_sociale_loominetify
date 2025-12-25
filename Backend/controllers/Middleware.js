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
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = decodedToken.exp - now;

      if (timeLeft < 30 * 60) {
        const newToken = jwt.sign(
          { id: decodedToken.id },
          "RANDOM_TOKEN_SECRET",
          { expiresIn: "2h" }
        );

        res.cookie("jwt", newToken, {
          httpOnly: true,
          sameSite: 'Lax'
        });
      }
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
module.exports.UserConnecte = (req, res) => {
  try {
    return res.status(200).json({ authenticated: true, userId: req.userId });
  } catch (error) {
    return res.status(500).json({ error: "Problème est servenue !" });
  }
}


