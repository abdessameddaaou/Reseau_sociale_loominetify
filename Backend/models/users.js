const { DataTypes, Model } = require("sequelize");

const db = require("../db/db");

const Users = db.define("Users", {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prenom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: { msg: "Cet email est déjà utilisé" },
    validate: {
      isEmail: {
        msg: "Le format de l'email est invalide",
      },
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telephone: {
    type: DataTypes.INTEGER,
    unique: false,
  },
  dateNaissance: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  ville: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pays: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  compteActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  photo: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  question: {
    type: DataTypes.ENUM(
      "Quel est le nom de votre premier animal de compagnie ?",
      "Dans quelle ville êtes-vous né(e) ?",
      "Quel est le nom de votre école primaire ?",
      "Quel est votre plat préféré ?"
    ),
    allowNull: false,
  },
  reponse: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  codeReinitialisation: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dateExpirationCode: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  bio: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  siteweb: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  profession: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

module.exports = Users;
  