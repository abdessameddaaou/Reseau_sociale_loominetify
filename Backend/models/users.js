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
    unique: true,
    validate: {
      isEmail: {
        msg: "Le format de l'email est invalide",
      }
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
    telephone: {
    type: DataTypes.INTEGER,
    unique: true,
  },
  dateNaissance: {
    type: DataTypes.DATEONLY,
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
  photo : {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

module.exports = Users;
