const { DataTypes, Model } = require("sequelize");
const db = require("../db/db");
const ConversationParticipant = db.define("ConversationParticipants", {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },

  conversationId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },

  lastReadAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ["userId", "conversationId"],
    },
  ],
});

module.exports = ConversationParticipant;