const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Incident title is required'],
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Fire', 'Flood', 'Medical', 'Debris', 'Search & Rescue', 'Hazardous Material', 'Power Outage', 'Other'],
    default: 'Other'
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  priority: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM',
  },
  status: {
    type: String,
    enum: ['VERIFYING', 'APPROVED', 'DISPATCHED', 'RESPONDING', 'RESOLVED', 'REJECTED'],
    default: 'VERIFYING',
  },
  location: {
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  reporter: {
    name: { type: String, default: 'Anonymous Citizen' },
    role: { type: String, default: 'Citizen' },
    contact: { type: String }
  },
  assignedResources: [{
    resourceId: String,
    name: String,
    type: String,
    qty: Number
  }],
  aiTriagePlan: {
    status: { type: String, enum: ['PENDING', 'PROPOSED', 'DEPLOYED'], default: 'PROPOSED' },
    summary: String,
    confidenceScore: { type: Number, default: 95 },
    recommendedActions: [String],
    recommendedResources: [mongoose.Schema.Types.Mixed]
  },
  auditLog: [{
    action: String,
    by: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
});

module.exports = mongoose.models.Incident || mongoose.model('Incident', incidentSchema);
