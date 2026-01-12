const { DataTypes } = require("sequelize");
const db = require("../db/db");
const Users = require("./users");

const UserRelation = db.define("UserRelations", {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  requesterId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },

  addresseeId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },

  status: {
    type: DataTypes.ENUM(
      "envoyée",   // invitation envoyée
      "acceptée",  // amis
      "refusée",   // invitation refusée
      "bloqué"    // bloqué
    ),
    allowNull: false,
  },

  blockedBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true, // qui a bloqué l'utilisateur
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ["requesterId", "addresseeId"],
    },
  ],
});
Users.hasMany(UserRelation, {
  foreignKey: "requesterId",
  as: "sentRelations",
});

Users.hasMany(UserRelation, {
  foreignKey: "addresseeId",
  as: "receivedRelations",
});

UserRelation.belongsTo(Users, {
  foreignKey: "requesterId",
  as: "requester",
});

UserRelation.belongsTo(Users, {
  foreignKey: "addresseeId",
  as: "addressee",
});

module.exports = UserRelation;