const {DataTypes, Model} = require('sequelize');
const db = require('../db/db');
const Users = require('./users');
const Publication = require('./publication');
const Commentaire = require('./commentaire');

const Interactions = db.define('Interactions', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    type : {
        type: DataTypes.ENUM('like','love', 'angry', 'sad', 'haha'),
        allowNull: false,
        defaultValue: 'like',
    }
})


// Relation entre Users et Interactions et publications

Users.hasMany(Interactions, {foreignKey: 'userId', as: 'interactions', onDelete: 'CASCADE'});
Interactions.belongsTo(Users, {foreignKey: 'userId', as: 'user'});
Publication.hasMany(Interactions, {foreignKey: 'publicationId', as: 'interactions', onDelete: 'CASCADE'});
Interactions.belongsTo(Publication, {foreignKey: 'publicationId', as: 'publication'});

module.exports = Interactions;