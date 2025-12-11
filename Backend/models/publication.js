const {DataTypes, Model} = require('sequelize');
const db = require('../db/db');
const Users = require('./users');
const Commentaire = require('./commentaire');

const Publication = db.define('Publications', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    description : {
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
    },
    nombreLikes : {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    nombrePartages : {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    }
})

Users.hasMany(Publication, {foreignKey: 'userId', as: 'publications', onDelete: 'CASCADE'});
  
Publication.belongsTo(Users, {foreignKey: 'userId', as: 'user'});

Publication.hasMany(Commentaire, {foreignKey: 'publicationId', onDelete: 'CASCADE'});

// Relation partage : un utilisateur peut partager plusieurs publications et une publication peut être partagée par plusieurs utilisateurs avec le nombre de like dans la table de jointure

Users.belongsToMany(Publication, { through: 'Partages', as: 'Partageurs', foreignKey: 'userId', otherKey: 'publicationId' });
Publication.belongsToMany(Users, { through: 'Partages', as: 'PublicationsPartagees', foreignKey: 'publicationId', otherKey: 'userId' });


// 
module.exports = Publication;