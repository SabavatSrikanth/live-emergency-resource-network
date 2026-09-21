const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Hospital Beds', 'Ambulances', 'Fire Tenders', 'Rescue Squads', 'Oxygen Cylinders', 'Emergency Shelters'],
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  available: {
    type: Number,
    required: true,
    default: 1
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'ALLOCATED', 'MAINTENANCE'],
    default: 'AVAILABLE'
  },
  location: {
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  provider: {
    name: { type: String, default: 'Emergency Services' },
    contact: { type: String, default: '911 / Direct Dispatch' }
  },
  assignedIncidentId: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
});

module.exports = mongoose.models.Resource || mongoose.model('Resource', resourceSchema);
