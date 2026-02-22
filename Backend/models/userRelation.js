const { DataTypes } = require("sequelize");
const db = require("../db/db");

const UserRelation = db.define("UserRelations", {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  requesterId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  addresseeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  status: {
    type: DataTypes.ENUM("envoyée", "acceptée", "refusée", "bloqué"),
    allowNull: false,
  },
  blockedBy: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, {
  indexes: [{ unique: true, fields: ["requesterId", "addresseeId"] }],
});

module.exports = UserRelation;