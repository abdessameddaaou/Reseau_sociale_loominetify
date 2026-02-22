const { DataTypes } = require("sequelize");
const db = require("../db/db");

const Commentaire = db.define('Commentaires', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    contenu: { type: DataTypes.TEXT, allowNull: false },
    image: { type: DataTypes.STRING, allowNull: true },
    nombreLikes: { type: DataTypes.INTEGER, defaultValue: 0 },
    publicationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }
});

module.exports = Commentaire;