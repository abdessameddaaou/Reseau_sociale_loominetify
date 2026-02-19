const { Users } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET || "CHANGE_MOI_VITE_DANS_DOTENV";
const EMAIL_USER = process.env.EMAIL_USER || "loominetify@gmail.com";
const EMAIL_PASS = process.env.EMAIL_PASS || "ton_mot_de_passe_application_ici";

/**
 * Création du token JWT
 */
const createToken = (id) => {
  return jwt.sign({ id }, SECRET_KEY, { expiresIn: "24h" });
};

/**
 * Configuration de Nodemailer
 */
const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS 
  }
});

/**
 * Connexion (Login)
 */
module.exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await Users.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    const passwordValide = await bcrypt.compare(password, user.password);
    if (!passwordValide) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    if (!user.compteActive) {
      return res.status(401).json({ error: "Veuillez confirmer votre compte avant de vous connecter." });
    }

    const token = createToken(user.id);

    res.cookie("jwt", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); 

    return res.status(200).json({ 
        userId: user.id,
        token: token,
        isAdmin: user.isAdmin,
        message: "Connexion réussie"
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Déconnexion (Logout)
 */
module.exports.logoutUser = (req, res) => {
  try {
    res.clearCookie("jwt");
    return res.status(200).json({ message: "Déconnexion réussie" });
  } catch (error) {
    return res.status(500).json({ error: "Erreur lors de la déconnexion." });
  }
};

/**
 * Demande de réinitialisation (Envoi du code par Email)
 */
module.exports.demandeReinitialisation = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await Users.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "Aucun utilisateur trouvé avec cet email." });
    }

    const codeReinitialisation = Math.floor(100000 + Math.random() * 900000).toString();
    const dateExpirationCode = new Date(Date.now() + 5 * 60 * 1000);

    user.codeReinitialisation = codeReinitialisation;
    user.dateExpirationCode = dateExpirationCode;
    await user.save();

    const htmlEmail = `<!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>Confirmation de compte</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f5f7fa; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08); border: 1px solid #e5e7eb; }
          .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
          .header h1 { font-size: 24px; color: #5b7cff; margin: 0; text-transform: lowercase; }
          .content { font-size: 15px; color: #333; line-height: 1.6; padding: 20px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #5b7cff, #8b5cf6); color: #fff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 25px 0; }
          .footer { text-align: center; font-size: 12px; color: #777; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>loominetify</h1></div>
          <div class="content">
            <p>Bonjour <strong>${user.prenom}</strong>,<br /><br/>Vous avez demandé la réinitialisation de votre mot de passe sur <strong>Loominetify</strong> 🎉<br />Pour finaliser votre réinitialisation, veuillez utiliser le code ci-dessous :</p>
            <div style="text-align:center;">
              <a href="#" class="btn">Code : <strong>${codeReinitialisation}</strong></a>
            </div>
            <p>Ce code est valide pendant 5 minutes. Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet email.</p>
          </div>
        </div>
      </body>
    </html>`;

    await transport.sendMail({
      from: EMAIL_USER,
      to: user.email,
      subject: 'Réinitialisation du mot de passe - Loominetify',
      html: htmlEmail
    });

    return res.status(200).json({ message: "Code envoyé par email." });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de l'envoi de l'email." });
  }
};

/**
 * Vérification du code (Étape intermédiaire)
 */
module.exports.checkCodeReinitialisation = async (req, res) => {
  try {
    const { email, codeReinitialisation } = req.body;
    const user = await Users.findOne({ where: { email } });

    if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

    if (user.codeReinitialisation !== codeReinitialisation) {
      return res.status(400).json({ error: "Code invalide." });
    }

    if (new Date() > user.dateExpirationCode) {
      return res.status(400).json({ error: "Code expiré." });
    } 

    return res.status(200).json({ message: "Code valide." });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Réinitialisation du mot de passe (Finale)
 */
module.exports.resetPasswordUser = async (req, res) => {
  try {

    const { email, codeReinitialisation, newPassword } = req.body;
    const user = await Users.findOne({ where: { email } });

    if (!user) return res.status(404).json({ error: "Utilisateur introuvable." });

    if (user.codeReinitialisation !== codeReinitialisation) {
        return res.status(400).json({ error: "Code invalide ou manquant." });
    }
    
    if (new Date() > user.dateExpirationCode) {
        return res.status(400).json({ error: "Code expiré." });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit être différent de l'ancien." });
    }

    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!regexPassword.test(newPassword)) {
      return res.status(400).json({ error: "Le mot de passe doit contenir 8 caractères, majuscule, minuscule, chiffre et caractère spécial." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    user.codeReinitialisation = null;
    user.dateExpirationCode = null;
    
    await user.save();

    return res.status(200).json({ message: "Mot de passe modifié avec succès." });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erreur lors de la modification du mot de passe." });
  }
};