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
    }
})