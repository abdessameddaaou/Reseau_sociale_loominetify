const { DataTypes } = require("sequelize");
const db = require("../db/db");

const Notification = db.define("Notification", {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    recipientId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        comment: "L'utilisateur qui reçoit la notification"
    },
    senderId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        comment: "L'utilisateur qui a déclenché l'action"
    },
    type: {
        type: DataTypes.ENUM('follow', 'like', 'comment', 'invite', 'message'),
        allowNull: false
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false
    },
    read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    relatedId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        comment: "ID de l'objet lié (ex: ID du post, ID du commentaire)"
    }
}, {
    tableName: 'Notifications'
});

module.exports = Notification;
