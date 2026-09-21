const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  channel: {
    type: String,
    required: true,
    default: 'ai-dispatch', // 'ai-dispatch', 'incident-coordination', 'volunteer-broadcast'
  },
  sender: {
    name: { type: String, required: true },
    role: { type: String, default: 'Citizen' },
    isAI: { type: Boolean, default: false }
  },
  text: {
    type: String,
    required: true,
  },
  incidentId: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
});

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
