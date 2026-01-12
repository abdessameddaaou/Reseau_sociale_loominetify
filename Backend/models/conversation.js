const { DataTypes, Model } = require("sequelize");
const db = require("../db/db");
const Users = require("./users");
const Message = require("./Message");
const ConversationParticipant = require("./conversationParticipant");
const Conversation = db.define("Conversations", {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  type: {
    type: DataTypes.ENUM("private", "group"),
    defaultValue: "private",
  },

  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
});

// Users
Users.belongsToMany(Conversation, {
  through: ConversationParticipant,
  foreignKey: "userId",
});

Conversation.belongsToMany(Users, {
  through: ConversationParticipant,
  foreignKey: "conversationId",
});

// Messages
Conversation.hasMany(Message, { foreignKey: "conversationId" });
Message.belongsTo(Conversation, { foreignKey: "conversationId" });

Users.hasMany(Message, { foreignKey: "senderId" });
Message.belongsTo(Users, { foreignKey: "senderId" });


module.exports = Conversation;