const { ConversationParticipant, Conversation, Message } = require("../models");


module.exports.EnvoyerMessage = async (req, res) => {
    try {
        const myId = req.userId;
        const { otherUserId, content, fileUrl } = req.body;

        if (!otherUserId) {
            return res.status(400).json({ error: "L'identifiant du destinataire est requis" });
        }

        if (myId == otherUserId) {
            return res.status(400).json({ error: "Impossible de discuter avec soi-même" });
        }

        const myConvs = await ConversationParticipant.findAll({
            where: { userId: myId },
            attributes: ['conversationId']
        });
        const myConvIds = myConvs.map(c => c.conversationId);

        const commonParticipant = await ConversationParticipant.findOne({
            where: {
                userId: otherUserId,
                conversationId: myConvIds
            },
            include: [{
                model: Conversation,
                where: { type: 'private' }
            }]
        });

        let targetConversationId;

        if (commonParticipant) {
            targetConversationId = commonParticipant.conversationId;
        } else {
            // Créer une nouvelle conversation
            const newConv = await Conversation.create({ type: 'private', creatorId: myId });
            targetConversationId = newConv.id;

            await ConversationParticipant.bulkCreate([
                { conversationId: targetConversationId, userId: myId, lastReadAt: new Date() },
                { conversationId: targetConversationId, userId: otherUserId, lastReadAt: null }
            ]);
        }

        // 2. Créer le message
        const message = await Message.create({
            conversationId: targetConversationId,
            senderId: myId,
            content: content,
            fileUrl: fileUrl,
            isDeleted: false
        });

        // 3. Mettre à jour la date de dernier message de la conversation
        await Conversation.update(
            { lastMessageAt: new Date() },
            { where: { id: targetConversationId } }
        );

        // TODO: Emettre un événement Socket.io pour le temps réel
        // const io = req.app.get('io');
        // io.to(`user_${otherUserId}`).emit('newMessage', message);

        return res.status(201).json(message);

    } catch (error) {
        console.error("Erreur EnvoyerMessage:", error);
        return res.status(500).json({ error: "Erreur serveur lors de l'envoi du message" });
    }
};
