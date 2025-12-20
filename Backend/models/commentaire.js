const {DataTypes, Model} = require('sequelize');
const db = require('../db/db');
const Users = require('./users');

const Commentaire = db.define('Commentaires', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    contenu : {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    image : {
        type: DataTypes.STRING,
        allowNull: true,
    },
    nombreLikes : {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    }

})

// Relations
Users.hasMany(Commentaire, {foreignKey: 'userId', onDelete: 'CASCADE'});
Commentaire.belongsTo(Users, {foreignKey: 'userId', as: 'user'});

module.exports = Commentaire;