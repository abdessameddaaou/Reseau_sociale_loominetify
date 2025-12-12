const Users = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
/**
 * Création du token 
 * @param {*} id 
 * @returns 
 */
const createToken = (id) => jwt.sign({ id }, "RANDOM_TOKEN_SECRET", { expiresIn: "2h" });


    /**
     * Conf de transporteur
     */
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'loominetify@gmail.com', 
        pass: 'dqoe iemb gnfq azpa' 
      }
    });


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

/** Demande de réinitialisation du mot de passe - à implémenter
 * @param {*} req 
 * @param {*} res
 * @returns
 */
  
module.exports.demandeReinitialisation = async (req, res) => {
  try {
    // R2cupérer l'email de l'utilisateur
    var checkUser = await Users.findOne({ where: { email: req.body.email } });
    if (!checkUser) {
      return res.status(404).json({ error: "Aucun utilisateur trouvé avec cet email." });
    }

    // Générer un code de réinitialisation
    const codeReinitialisation = Math.floor(100000 + Math.random() * 900000).toString();
    const dateExpirationCode = new Date(Date.now() +  5 * 60 * 1000); 
    
    // Modifier l'utilisateur avec le code et la date d'expiration
    checkUser.codeReinitialisation = codeReinitialisation;
    checkUser.dateExpirationCode = dateExpirationCode;
    await checkUser.save();


    // Envoyer le code par email
    const htmlEmail = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Confirmation de compte</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f5f7fa;
        margin: 0;
        padding: 0;
      }

      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #ffffff;
        border-radius: 12px;
        padding: 30px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
        border: 1px solid #e5e7eb;
      }

      .header {
        text-align: center;
        padding-bottom: 20px;
        border-bottom: 1px solid #eee;
      }

      .header h1 {
        font-size: 24px;
        color: #5b7cff;
        margin: 0;
        text-transform: lowercase;
      }

      .content {
        font-size: 15px;
        color: #333;
        line-height: 1.6;
        padding: 20px 0;
      }

      .btn {
        display: inline-block;
        background: linear-gradient(135deg, #5b7cff, #8b5cf6);
        color: #fff !important;
        padding: 12px 28px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
        margin: 25px 0;
      }

      .footer {
        text-align: center;
        font-size: 12px;
        color: #777;
        padding-top: 20px;
        border-top: 1px solid #eee;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="header">
        <h1>loominetify</h1>
      </div>

      <div class="content">
        <p>
          Bonjour <strong>${checkUser.prenom}</strong>,<br /><br/>
          Vous avez demandé la réinitialisation de votre mot de passe sur <strong>Loominetify</strong> 🎉<br />
          Pour finaliser votre réinitialisation, veuillez utiliser le code ci-dessous :
        </p>

        <div style="text-align:center;">
          <a href="#" class="btn" target="_blank" rel="noopener noreferrer">
            Code : <strong>${codeReinitialisation}</strong>
          </a>
        </div>

        <p>
        Ce code est valide pendant 5 minutes.
        Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet
        email en toute sécurité.
        </p>
      </div>
    </div>
  </body>
</html>`;

    const mailOptions = {
      from: 'loominetify@gmail.com',
      to: checkUser.email,
      subject: 'Réinitialisation du mot de passe sur Loominetify',
      html: htmlEmail
    };

    await transport.sendMail(mailOptions);

    return res.status(200).json({ message: "Code de réinitialisation envoyé à l'email." });
  } catch (error) {
    console.error("Erreur lors de l'envoi du code de réinitialisation :", error);
    return res.status(500).json({ error: "Une erreur est survenue lors de l'envoi du code de réinitialisation." });
  }
}

/** Vérifier le code de réinitialisation du mot de passe 
 * @param {*} req 
 * @param {*} res
 * @returns
 */

module.exports.checkCodeReinitialisation = async (req, res) => {
  try {
    // Vérifier l'email et le code et la date d'expiration
    const checkUser = await Users.findOne({ where: { email: req.body.email } });

    if (!checkUser) {
      return res.status(404).json({ error: "Aucun utilisateur trouvé avec cet email." });
    }

    if (checkUser.codeReinitialisation !== req.body.codeReinitialisation) {
      return res.status(400).json({ error: "Code de réinitialisation invalide." });
    }
    if (new Date() > checkUser.dateExpirationCode) {
      return res.status(400).json({ error: "Le code de réinitialisation a expiré." });
    } 

    return res.status(200).json({ message: "Code de réinitialisation valide." });

  } catch (error) {
    console.error("Erreur lors de la vérification du code de réinitialisation :", error);
    return res.status(500).json({ error: "Une erreur est survenue lors de la vérification du code de réinitialisation." });
  }
}


/** Réinitialisation du mot de passe
 * @param {*} req 
 * @param {*} res
 * @returns
 */

module.exports.resetPasswordUser = async (req, res) => {
  try {
    // Vérifier l'email
    const checkUser = await Users.findOne({ where: { email: req.body.email } });

    if (!checkUser) {
      return res.status(404).json({ error: "Aucun utilisateur trouvé avec cet email." });
    }

    

    // Vérifier si le nouveau mot de passe est différent de l'ancien
    const oldPassword = await bcrypt.compare(req.body.newPassword, checkUser.password);
    if (oldPassword) {
      return res.status(400).json({ error: "Le nouveau mot de passe doit être différent de l'ancien." });
    }

    // Vérifier le format du nouveau mot de passe
    const regexPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!regexPassword.test(req.body.newPassword)) {
      return res.status(400).json({ error: "Le nouveau mot de passe ne respecte pas les critères de sécurité." });
    }
    
    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
    checkUser.password = hashedPassword;
    // Supprimer le code de réinitialisation et la date d'expiration
    checkUser.codeReinitialisation = null;
    checkUser.dateExpirationCode = null;
    await checkUser.save();

    return res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la réinitialisation du mot de passe :", error);
    return res.status(500).json({ error: "Une erreur est survenue lors de la réinitialisation du mot de passe." });
  }
}