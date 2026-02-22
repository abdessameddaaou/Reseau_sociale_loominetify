const { DataTypes } = require("sequelize");
const db = require("../db/db");

const Conversation = db.define(
  "Conversations",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.ENUM("private", "group"),
      defaultValue: "private",
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    creatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  { timestamps: true },
);

module.exports = Conversation;
