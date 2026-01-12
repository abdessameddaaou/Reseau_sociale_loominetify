const { DataTypes, Model } = require("sequelize");

const db = require("../db/db");

const Message = db.define("Messages", {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  conversationId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },

  senderId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },

  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  type: {
    type: DataTypes.ENUM("text", "image", "file"),
    defaultValue: "text",
  },

  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
});

module.exports = Message;