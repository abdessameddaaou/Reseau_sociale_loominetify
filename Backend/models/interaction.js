const { DataTypes } = require('sequelize');
const db = require('../db/db');

const Interactions = db.define('Interactions', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('like', 'love', 'angry', 'sad', 'haha'),
        allowNull: false,
        defaultValue: 'like',
    },
    // On ajoute explicitement les clés étrangères pour la propreté
    userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    },
    publicationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
    }
}, {
    // Optionnel : évite qu'un user like 2 fois la même publi
    indexes: [
        {
            unique: true,
            fields: ['userId', 'publicationId']
        }
    ]
});

module.exports = Interactions;