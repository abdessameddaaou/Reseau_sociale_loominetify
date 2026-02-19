const db = require("../db/db");

// 1. IMPORTATION DES MODÈLES
const Users = require("./users");
const UserRelation = require("./userRelation");
const UserFollow = require("./userFollows");
const Publication = require("./publication");
const Commentaire = require("./commentaire");
const Interactions = require("./interaction");
const Conversation = require("./conversation");
const Message = require("./message");
const ConversationParticipant = require("./conversationParticipant");
const Notification = require("./notification");

// 2. DÉFINITION DES RELATIONS

// --- Relations Sociales (Amis / Suivis) ---
Users.hasMany(UserRelation, { foreignKey: "requesterId", as: "sentRelations" });
Users.hasMany(UserRelation, { foreignKey: "addresseeId", as: "receivedRelations" });
UserRelation.belongsTo(Users, { foreignKey: "requesterId", as: "requester" });
UserRelation.belongsTo(Users, { foreignKey: "addresseeId", as: "addressee" });

Users.belongsToMany(Users, { through: UserFollow, as: "following", foreignKey: "followerId", otherKey: "followingId" });
Users.belongsToMany(Users, { through: UserFollow, as: "followers", foreignKey: "followingId", otherKey: "followerId" });

// --- Relations Publications & Commentaires ---
Users.hasMany(Publication, { foreignKey: 'userId', as: 'publications', onDelete: 'CASCADE' });
Publication.belongsTo(Users, { foreignKey: 'userId', as: 'user' });

Publication.hasMany(Commentaire, { foreignKey: 'publicationId', as: 'comments', onDelete: 'CASCADE' });
Commentaire.belongsTo(Publication, { foreignKey: 'publicationId', as: 'publication' });

Users.hasMany(Commentaire, { foreignKey: 'userId', as: 'userComments', onDelete: 'CASCADE' });
Commentaire.belongsTo(Users, { foreignKey: 'userId', as: 'user' });

Publication.belongsTo(Publication, { as: 'sharedPublication', foreignKey: 'sharedPublicationId' });

// --- Relations Interactions (Likes/Reactions) --- 
Users.hasMany(Interactions, { foreignKey: 'userId', as: 'interactions', onDelete: 'CASCADE' });
Interactions.belongsTo(Users, { foreignKey: 'userId', as: 'user' });

Publication.hasMany(Interactions, { foreignKey: 'publicationId', as: 'reactions', onDelete: 'CASCADE' });
Interactions.belongsTo(Publication, { foreignKey: 'publicationId', as: 'publication' });


// --- Relations Messagerie ---
Users.belongsToMany(Conversation, { through: ConversationParticipant, foreignKey: "userId", as: "conversations" });
Conversation.belongsToMany(Users, { through: ConversationParticipant, foreignKey: "conversationId", as: "participants" });

// Associations explicites pour la table de jointure (nécessaire pour les queries directes sur ConversationParticipant)
ConversationParticipant.belongsTo(Conversation, { foreignKey: "conversationId" });
ConversationParticipant.belongsTo(Users, { foreignKey: "userId" });

Conversation.hasMany(ConversationParticipant, { foreignKey: "conversationId" });
Users.hasMany(ConversationParticipant, { foreignKey: "userId" });

Conversation.hasMany(Message, { foreignKey: "conversationId", as: "messages" });

Message.belongsTo(Conversation, { foreignKey: "conversationId", as: "conversation" });

Users.hasMany(Message, { foreignKey: "senderId", as: "sentMessages" });
Message.belongsTo(Users, { foreignKey: "senderId", as: "sender" });

Conversation.belongsTo(Users, { foreignKey: "creatorId", as: "creator" });

// --- Relations Notifications ---
Users.hasMany(Notification, { foreignKey: 'recipientId', as: 'notificationsReceived', onDelete: 'CASCADE' });
Users.hasMany(Notification, { foreignKey: 'senderId', as: 'notificationsSent', onDelete: 'CASCADE' });
Notification.belongsTo(Users, { foreignKey: 'recipientId', as: 'recipient' });
Notification.belongsTo(Users, { foreignKey: 'senderId', as: 'sender' });

// 3. EXPORTATION
module.exports = {
  db,
  Users,
  UserRelation,
  UserFollow,
  Publication,
  Commentaire,
  Interactions,
  Conversation,
  Message,
  ConversationParticipant,
  Notification
};