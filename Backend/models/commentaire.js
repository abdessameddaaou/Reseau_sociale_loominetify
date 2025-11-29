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
    }
})

// Relations
Users.hasMany(Commentaire, {foreignKey: 'userId', onDelete: 'CASCADE'});
Commentaire.belongsTo(Users, {foreignKey: 'userId'});

module.exports = Commentaire;