const { DataTypes } = require("sequelize");
const db = require("../db/db");

const Publication = db.define('Publications', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    image: { type: DataTypes.STRING, allowNull: true },
    video: { type: DataTypes.STRING, allowNull: true },
    nombreLikes: { type: DataTypes.INTEGER, defaultValue: 0 },
    nombrePartages: { type: DataTypes.INTEGER, defaultValue: 0 },
    sharedPublicationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    commentairePartage: { type: DataTypes.TEXT, allowNull: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    visibility: { type: DataTypes.ENUM('public', 'private'), defaultValue: 'public' }
});

module.exports = Publication;