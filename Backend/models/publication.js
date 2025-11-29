const {DataTypes, Model} = require('sequelize');
const db = require('../db/db');
const Users = require('./users');
const Commentaire = require('./Commentaire');

const Publication = db.define('Publications', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    descrition : {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    image : {
        type: DataTypes.STRING,
        allowNull: true,
    },
    video : {
        type: DataTypes.STRING,
        allowNull: true,
    }
})

Users.hasMany(Publication, {foreignKey: 'userId', onDelete: 'CASCADE'});
  
Publication.belongsTo(Users, {foreignKey: 'userId'});

Publication.hasMany(Commentaire, {foreignKey: 'publicationId', onDelete: 'CASCADE'});

module.exports = Publication;