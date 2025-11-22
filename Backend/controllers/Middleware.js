const jwt = require("jsonwebtoken");
module.exports.checkUser = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ message: "Non autorisé : aucun token trouvé." });
  }

  jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
    if (err) {
      res.clearCookie("jwt");
      return res.status(401).json({ message: "Token invalide." });
    } else {
      req.userId = decodedToken.id;
      next();
    }
  });
};




