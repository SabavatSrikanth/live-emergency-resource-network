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
      const Resource = require('../models/Resource');
      let activeIncidentsCount = 0;
      let totalIncidentsCount = 0;
      let availableBedsCount = 0;

      if (isDbConnected()) {
        const Incident = require('../models/Incident');
        activeIncidentsCount = await Incident.countDocuments({ status: { $ne: 'RESOLVED' } });
        totalIncidentsCount = await Incident.countDocuments({});
        const resources = await Resource.find({ type: 'Hospital Beds' });
        availableBedsCount = resources.reduce((acc, r) => acc + (r.available || 0), 0);
      } else {
        const incidents = seedData.getIncidents();
        activeIncidentsCount = incidents.filter(i => i.status !== 'RESOLVED').length;
        totalIncidentsCount = incidents.length;
        const resources = seedData.getResources().filter(r => r.type === 'Hospital Beds');
        availableBedsCount = resources.reduce((acc, r) => acc + (r.available || 0), 0);
      }

      let aiText = `I have logged your dispatch query into the crisis management database. Currently tracking ${activeIncidentsCount} active emergency reports and ${availableBedsCount} available hospital beds.`;
      const queryLower = text.toLowerCase();
      
      if (queryLower.includes('fire') || queryLower.includes('burn')) {
        aiText = `⚠️ Fire emergency protocol checked. Active emergencies remaining: ${activeIncidentsCount}. 2 engines at Station #7 ready for deployment.`;
      } else if (queryLower.includes('bed') || queryLower.includes('hospital') || queryLower.includes('icu')) {
        aiText = `🏥 Real-time Hospital Capacity: ${availableBedsCount} ICU/trauma beds currently available across facilities. EMS units on standby.`;
      } else if (queryLower.includes('flood') || queryLower.includes('water') || queryLower.includes('boat')) {
        aiText = `🌊 Aquatic flood protocol active. ${activeIncidentsCount} active reports being monitored by field rescue squads.`;
      } else if (queryLower.includes('status') || queryLower.includes('report') || queryLower.includes('summary') || queryLower.includes('active') || queryLower.includes('any')) {
        if (activeIncidentsCount === 0) {
          aiText = `✅ LERN System Status: All emergency incident reports have been RESOLVED! Currently 0 active emergencies. 142 On-Duty Volunteers and ${availableBedsCount} Hospital Beds on standby.`;
        } else {
          aiText = `📊 Live LERN System Status: ${activeIncidentsCount} Active Emergency Report(s) remaining (${totalIncidentsCount - activeIncidentsCount} resolved today). ${availableBedsCount} Hospital Beds available across 4 facilities.`;
        }
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
