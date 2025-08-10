import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { generateAIResponse } from '../utils/openai.js';

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const { content, receiver, messageType = 'user' } = req.body;
    const sender = req.user.id;

    let message;
    let conversation;

    if (messageType === 'ai') {
      // Handle AI message
      const conversationHistory = await Message.find({
        $or: [
          { sender, messageType: 'ai' },
          { sender, messageType: 'user', receiver: null }
        ]
      }).sort({ createdAt: -1 }).limit(10);

      const aiResponse = await generateAIResponse(content, conversationHistory);

      // Save user message
      const userMessage = await Message.create({
        sender,
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

      return res.status(201).json({
        success: true,
        messages: [userMessage, aiMessage]
      });
    } else {
      // Handle user-to-user message
      if (!receiver) {
        return res.status(400).json({
          success: false,
          message: 'Receiver is required for user messages'
        });
      }

      // Check if receiver exists
      const receiverUser = await User.findById(receiver);
      if (!receiverUser) {
        return res.status(404).json({
          success: false,
          message: 'Receiver not found'
        });
      }

      // Create message
      message = await Message.create({
        sender,
        receiver,
        content,
        messageType,
        isDelivered: true,
        deliveredAt: new Date()
      });

      // Find or create conversation
      conversation = await Conversation.findOne({
        participants: { $all: [sender, receiver] },
        isAIConversation: false
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [sender, receiver],
          lastMessage: message._id,
          lastMessageTime: message.createdAt,
          unreadCount: {
            [sender]: 0,
            [receiver]: 1
          }
        });
      } else {
        conversation.lastMessage = message._id;
        conversation.lastMessageTime = message.createdAt;
        conversation.unreadCount.set(receiver, (conversation.unreadCount.get(receiver) || 0) + 1);
        await conversation.save();
      }

      await message.populate('sender', 'username avatar');
      await message.populate('receiver', 'username avatar');

      res.status(201).json({
        success: true,
        message
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:userId
// @access  Private
export const getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    let messages;

    if (userId === 'ai') {
      // Get AI conversation messages
      messages = await Message.find({
        $or: [
          { sender: currentUser, messageType: 'ai' },
          { sender: currentUser, messageType: 'user', receiver: null },
          { messageType: 'ai', receiver: null }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('sender', 'username avatar');
    } else {
      // Get user-to-user messages
      messages = await Message.find({
        $or: [
          { sender: currentUser, receiver: userId },
          { sender: userId, receiver: currentUser }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('sender', 'username avatar')
        .populate('receiver', 'username avatar');
    }

    res.status(200).json({
      success: true,
      count: messages.length,
      messages: messages.reverse()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:conversationId
// @access  Private
export const markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Update messages as read
    await Message.updateMany(
      {
        receiver: userId,
        isRead: false,
        $or: [
          { sender: conversationId },
          { receiver: conversationId }
        ]
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Update conversation unread count
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, conversationId] }
    });

    if (conversation) {
      conversation.unreadCount.set(userId, 0);
      await conversation.save();
    }

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
};
