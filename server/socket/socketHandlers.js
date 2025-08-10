import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { generateAIResponse } from '../utils/openai.js';

const activeUsers = new Map();

export const handleConnection = (io) => {
  return async (socket) => {
    try {
      const user = socket.user;
      console.log(`User ${user.username} connected with socket ID: ${socket.id}`);

      // Update user status
      await User.findByIdAndUpdate(user._id, {
        isOnline: true,
        socketId: socket.id,
        lastSeen: new Date()
      });

      activeUsers.set(user._id.toString(), socket.id);

      // Join user to their own room
      socket.join(user._id.toString());

      // Broadcast user online status
      socket.broadcast.emit('userOnline', {
        userId: user._id,
        username: user.username,
        isOnline: true
      });

      // Handle joining conversation rooms
      socket.on('joinConversation', async (data) => {
        const { conversationId } = data;
        socket.join(conversationId);
        console.log(`User ${user.username} joined conversation: ${conversationId}`);
      });

      // Handle leaving conversation rooms
      socket.on('leaveConversation', (data) => {
        const { conversationId } = data;
        socket.leave(conversationId);
        console.log(`User ${user.username} left conversation: ${conversationId}`);
      });

      // Handle sending messages
      socket.on('sendMessage', async (data) => {
        try {
          const { content, receiver, messageType = 'user' } = data;

          if (messageType === 'ai') {
            // Handle AI message
            const conversationHistory = await Message.find({
              $or: [
                { sender: user._id, messageType: 'ai' },
                { sender: user._id, messageType: 'user', receiver: null }
              ]
            }).sort({ createdAt: -1 }).limit(10);

            const aiResponse = await generateAIResponse(content, conversationHistory);

            // Save user message
            const userMessage = await Message.create({
              sender: user._id,
              content,
              messageType: 'user'
            });

            // Save AI response
            const aiMessage = await Message.create({
              sender: null,
              content: aiResponse,
              messageType: 'ai',
              isDelivered: true,
              deliveredAt: new Date()
            });

            // Emit to sender
            socket.emit('messageReceived', {
              userMessage: await userMessage.populate('sender', 'username avatar'),
              aiMessage
            });

          } else {
            // Handle user-to-user message
            const message = await Message.create({
              sender: user._id,
              receiver,
              content,
              messageType,
              isDelivered: true,
              deliveredAt: new Date()
            });

            await message.populate('sender', 'username avatar');
            await message.populate('receiver', 'username avatar');

            // Update or create conversation
            let conversation = await Conversation.findOne({
              participants: { $all: [user._id, receiver] },
              isAIConversation: false
            });

            if (!conversation) {
              conversation = await Conversation.create({
                participants: [user._id, receiver],
                lastMessage: message._id,
                lastMessageTime: message.createdAt,
                unreadCount: {
                  [user._id]: 0,
                  [receiver]: 1
                }
              });
            } else {
              conversation.lastMessage = message._id;
              conversation.lastMessageTime = message.createdAt;
              conversation.unreadCount.set(receiver, (conversation.unreadCount.get(receiver) || 0) + 1);
              await conversation.save();
            }

            // Emit to sender
            socket.emit('messageReceived', message);

            // Emit to receiver if online
            const receiverSocketId = activeUsers.get(receiver);
            if (receiverSocketId) {
              io.to(receiverSocketId).emit('newMessage', message);
            }
          }
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('messageError', { error: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing', (data) => {
        const { receiver, isTyping } = data;
        const receiverSocketId = activeUsers.get(receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('userTyping', {
            userId: user._id,
            username: user.username,
            isTyping
          });
        }
      });

      // Handle message read receipts
      socket.on('markAsRead', async (data) => {
        try {
          const { messageIds } = data;
          
          await Message.updateMany(
            { _id: { $in: messageIds }, receiver: user._id },
            { isRead: true, readAt: new Date() }
          );

          // Notify senders about read receipts
          const messages = await Message.find({ _id: { $in: messageIds } });
          messages.forEach(message => {
            const senderSocketId = activeUsers.get(message.sender.toString());
            if (senderSocketId) {
              io.to(senderSocketId).emit('messageRead', {
                messageId: message._id,
                readBy: user._id,
                readAt: new Date()
              });
            }
          });
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        try {
          console.log(`User ${user.username} disconnected`);

          // Update user status
          await User.findByIdAndUpdate(user._id, {
            isOnline: false,
            lastSeen: new Date(),
            socketId: ''
          });

          activeUsers.delete(user._id.toString());

          // Broadcast user offline status
          socket.broadcast.emit('userOffline', {
            userId: user._id,
            username: user.username,
            isOnline: false,
            lastSeen: new Date()
          });
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });

    } catch (error) {
      console.error('Socket connection error:', error);
      socket.disconnect();
    }
  };
};
