const Message = require('../models/Message');
const seedData = require('../utils/seedData');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Get messages for a channel
exports.getMessages = async (req, res) => {
  try {
    const channel = req.query.channel || 'ai-dispatch';

    if (isDbConnected()) {
      let messages = await Message.find({ channel }).sort({ createdAt: 1 });
      if (messages.length === 0) {
        const initialSeeds = seedData.getMessages(channel);
        try {
          await Message.insertMany(initialSeeds.map(m => {
            const { _id, ...rest } = m;
            return rest;
          }));
          messages = await Message.find({ channel }).sort({ createdAt: 1 });
        } catch (err) {
          messages = initialSeeds;
        }
      }
      return res.json({ success: true, count: messages.length, data: messages });
    }

    const messages = seedData.getMessages(channel);
    return res.json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    logger.error(`Error fetching chat messages: ${error.message}`);
    return res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

// Send message & get optional AI automated dispatch reply
exports.sendMessage = async (req, res) => {
  try {
    const { channel = 'ai-dispatch', text, sender } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    const messageData = {
      channel,
      sender: {
        name: sender?.name || req.user?.name || 'Dispatcher',
        role: sender?.role || req.user?.role || 'Citizen',
        isAI: false
      },
      text
    };

    let userMsg;
    if (isDbConnected()) {
      userMsg = await Message.create(messageData);
    } else {
      userMsg = {
        _id: 'msg-' + Date.now(),
        ...messageData,
        createdAt: new Date().toISOString()
      };
      seedData.addMessage(userMsg);
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit('chat:message', userMsg);
    }

    // Auto-generate AI Response if channel is 'ai-dispatch'
    let aiResponseMsg = null;
    if (channel === 'ai-dispatch') {
      const agentService = require('../services/agentService');
      const sessionId = sender?.name || req.user?.name || 'default_session';
      
      let aiText;
      try {
        aiText = await agentService.handleAgenticChat(sessionId, text);
      } catch(err) {
        logger.error(`Agentic chat failed: ${err.message}`);
        aiText = `Error connecting to LERN Command AI: ${err.message}`;
      }

      const aiMsgData = {
        channel: 'ai-dispatch',
        sender: {
          name: 'LERN Command AI',
          role: 'AI Assistant',
          isAI: true
        },
        text: aiText
      };

      if (isDbConnected()) {
        aiResponseMsg = await Message.create(aiMsgData);
      } else {
        aiResponseMsg = {
          _id: 'msg-' + (Date.now() + 1),
          ...aiMsgData,
          createdAt: new Date().toISOString()
        };
        seedData.addMessage(aiResponseMsg);
      }

      if (io) {
        setTimeout(() => {
          io.emit('chat:message', aiResponseMsg);
        }, 600);
      }
    }

    return res.status(201).json({ 
      success: true, 
      data: userMsg, 
      aiResponse: aiResponseMsg 
    });
  } catch (error) {
    logger.error(`Error sending message: ${error.message}`);
    return res.status(500).json({ error: 'Failed to send message' });
  }
};
