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
        allowNull: true,
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
    },
    sharedPublicationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
    },
    commentairePartage: {
        type: DataTypes.TEXT,
        allowNull: true,
    }

})

Users.hasMany(Publication, {foreignKey: 'userId', as: 'publications', onDelete: 'CASCADE'});
  
Publication.belongsTo(Users, {foreignKey: 'userId', as: 'user'});

Publication.hasMany(Commentaire, {foreignKey: 'publicationId', as: 'comments', onDelete: 'CASCADE'});


// Relation partage : un utilisateur peut partager plusieurs publications et une publication peut être partagée par plusieurs utilisateurs

Publication.belongsTo(Publication, {
  as: 'sharedPublication',
  foreignKey: 'sharedPublicationId'
});

// 
module.exports = Publication;