const Conversation = require("../models/conversation");
const ConversationParticipant = require("../models/conversationParticipant");
const Message = require("../models/Message");
const Users = require("../models/users");

// Envoyer un message
module.exports.sendMessage = async (req, res) => {
  return res.status(200).json({ message: "Endpoint de message opérationnel" });
  // try {
  //   // Créer une conversation si elle n'existe pas
  //   const conversationId = req.body.conversationId;
  //   if (!conversationId) {
  //       const newConversation = await Conversation.create({ type: "private" });
  //       const participant1 = await ConversationParticipant.create({
  //           userId: req.userId,
  //           conversationId: newConversation.id,
  //       });
  //       const participant2 = await ConversationParticipant.create({
  //           userId: req.body.recipientId,
  //           conversationId: newConversation.id,
  //       });
  //       req.body.conversationId = newConversation.id;
  //   }

  //   const { conversationId, content } = req.body;
  //   const senderId = req.userId;
  //   const conversation = await Conversation.findByPk(conversationId);
  //   if (!conversation) {
  //     return res.status(404).json({ message: "Conversation non trouvée" });
  //   }
    
  //   const newMessage = await Message.create({
  //     conversationId,
  //     senderId,
  //       content,
  //   });
  //   // Mettre à jour la date du dernier message dans la conversation
  //   conversation.lastMessageAt = new Date();
  //   await conversation.save();
  //   return res.status(201).json({ message: "Message envoyé avec succès", data: newMessage });
  // } catch (error) {
  //   return res.status(500).json({ message: "Erreur interne du serveur", error: error.message });
  // } 
};