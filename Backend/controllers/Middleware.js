const jwt = require("jsonwebtoken");
require('dotenv').config();

// Récupération de la clé secrète
const SECRET_KEY = process.env.JWT_SECRET || "CHANGE_MOI_DANS_DOTENV";

module.exports.checkUser = (req, res, next) => {
  const token = req.cookies.jwt;


  if (!token) {
    return res.status(401).json({ message: "Non autorisé : Connectez-vous d'abord." });
  }

  jwt.verify(token, SECRET_KEY, async (err, decodedToken) => {
    if (err) {
      res.clearCookie("jwt");
      return res.status(401).json({ message: "Session expirée, veuillez vous reconnecter." });
    } else {
      
      // --- LOGIQUE DE RAFRAÎCHISSEMENT (Sliding Expiration) ---
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = decodedToken.exp - now;
      
      // 30 * 60 = 1800 secondes (30 minutes)
      if (timeLeft < 30 * 60) {
        const newToken = jwt.sign(
          { id: decodedToken.id },
          SECRET_KEY,
          { expiresIn: "2h" }
        );

        res.cookie("jwt", newToken, {
          httpOnly: true,
          maxAge: 2 * 60 * 60 * 1000,
          sameSite: 'Lax' 
        });
      }
      req.userId = decodedToken.id;
      
      next();
    }
  });
};

module.exports.UserConnecte = (req, res) => {
  try {
    return res.status(200).json({ 
        authenticated: true, 
        userId: req.userId 
    });
  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur lors de la vérification." });
  }
}