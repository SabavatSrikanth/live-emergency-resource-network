const Incident = require('../models/Incident');
const seedData = require('../utils/seedData');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Helper to check if DB is connected
const isDbConnected = () => mongoose.connection.readyState === 1;

// Get all incidents with filters
exports.getIncidents = async (req, res) => {
  try {
    const { priority, status, category, search } = req.query;

    if (isDbConnected()) {
      let query = {};
      if (priority) query.priority = priority;
      if (status) query.status = status;
      if (category) query.category = category;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'location.address': { $regex: search, $options: 'i' } }
        ];
      }
      let incidents = await Incident.find(query).sort({ createdAt: -1 });
      if (incidents.length === 0 && !priority && !status && !category && !search) {
        // Auto-seed database if empty
        const initialSeeds = seedData.getIncidents();
        try {
          await Incident.insertMany(initialSeeds.map(i => {
            const { _id, ...rest } = i;
            return rest;
          }));
          incidents = await Incident.find(query).sort({ createdAt: -1 });
        } catch (seedErr) {
          logger.warn(`Mongo insertMany seed skipped: ${seedErr.message}`);
          incidents = seedData.getIncidents();
        }
      }
      return res.json({ success: true, count: incidents.length, data: incidents });
    }

    // Fallback to in-memory store
    let incidents = seedData.getIncidents();
    if (priority) incidents = incidents.filter(i => i.priority === priority);
    if (status) incidents = incidents.filter(i => i.status === status);
    if (category) incidents = incidents.filter(i => i.category === category);
    if (search) {
      const q = search.toLowerCase();
      incidents = incidents.filter(i => 
        i.title.toLowerCase().includes(q) || 
        i.description.toLowerCase().includes(q) || 
        i.location.address.toLowerCase().includes(q)
      );
    }
    return res.json({ success: true, count: incidents.length, data: incidents });
  } catch (error) {
    logger.error(`Error fetching incidents: ${error.message}`);
    return res.status(500).json({ error: 'Failed to fetch incidents' });
  }
};

// Create new incident
exports.createIncident = async (req, res) => {
  try {
    const { title, category, description, priority, location, reporter } = req.body;

    const addressStr = typeof location === 'string' ? location : (location?.address || 'City Operations Center');
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const lat = (typeof location === 'object' && location?.coordinates?.lat) ? Number(location.coordinates.lat) : (40.7128 + (Math.random() - 0.5) * 0.04);
    const lng = (typeof location === 'object' && location?.coordinates?.lng) ? Number(location.coordinates.lng) : (-74.0060 + (Math.random() - 0.5) * 0.04);

    // Dynamic AI triage plan generator
    const recommendedResources = category === 'Fire' ? [{ type: 'Fire Tenders', qty: 2 }, { type: 'Ambulances', qty: 1 }]
      : category === 'Medical' ? [{ type: 'Ambulances', qty: 1 }, { type: 'Hospital Beds', qty: 1 }]
      : category === 'Flood' ? [{ type: 'Rescue Squads', qty: 2 }]
      : [{ type: 'Rescue Squads', qty: 1 }];

    const aiTriagePlan = {
      status: 'PROPOSED',
      summary: `Automated LERN AI Plan: Deploy ${recommendedResources.map(r => `${r.qty} ${r.type}`).join(' & ')} to ${addressStr}.`,
      confidenceScore: Math.floor(Math.random() * 10) + 90,
      recommendedActions: [
        `Dispatch closest response team to ${addressStr}.`,
        `Notify nearby responders within 5km radius.`,
        `Pre-reserve capacity at closest emergency depot.`
      ],
      recommendedResources
    };

    const incidentData = {
      title,
      category: category || 'Other',
      description,
      priority: priority || 'MEDIUM',
      status: 'VERIFYING',
      location: {
        address: addressStr,
        coordinates: { lat, lng }
      },
      reporter: {
        name: reporter?.name || req.user?.name || 'Anonymous Citizen',
        role: reporter?.role || req.user?.role || 'Citizen',
        contact: reporter?.contact || 'Standard Feed'
      },
      assignedResources: [],
      aiTriagePlan,
      auditLog: [{
        action: 'Incident Report Created',
        by: req.user?.name || reporter?.name || 'Citizen',
        timestamp: new Date()
      }]
    };

    let newIncident;
    if (isDbConnected()) {
      newIncident = await Incident.create(incidentData);
    } else {
      newIncident = {
        _id: 'inc-' + Date.now(),
        ...incidentData,
        createdAt: new Date().toISOString()
      };
      seedData.addIncident(newIncident);
    }

    // Broadcast via Socket.IO if available
    const io = req.app.get('socketio');
    if (io) {
      io.emit('incident:created', newIncident);
      io.emit('ai:dispatch_plan', { incidentId: newIncident._id, plan: aiTriagePlan });
    }

    logger.info(`New Incident Created: ${newIncident.title} (${newIncident._id})`);
    return res.status(201).json({ success: true, data: newIncident });
  } catch (error) {
    logger.error(`Error creating incident: ${error.message} - ${error.stack}`);
    return res.status(500).json({ error: error.message || 'Failed to create incident report' });
  }
};

// Update incident status / priority / triage deployment
exports.updateIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, aiTriageStatus, assignedResources } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assignedResources) updates.assignedResources = assignedResources;

    let updatedIncident;
    if (isDbConnected()) {
      const incident = await Incident.findById(id);
      if (!incident) return res.status(404).json({ error: 'Incident not found' });

      if (status) incident.status = status;
      if (priority) incident.priority = priority;
      if (assignedResources) incident.assignedResources = assignedResources;
      if (aiTriageStatus && incident.aiTriagePlan) {
        incident.aiTriagePlan.status = aiTriageStatus;
      }
      incident.auditLog.push({
        action: `Updated status to ${status || 'modified'}`,
        by: req.user?.name || 'Dispatcher',
        timestamp: new Date()
      });

      updatedIncident = await incident.save();
    } else {
      const existing = seedData.getIncidents().find(i => i._id === id || i.id === id);
      if (!existing) return res.status(404).json({ error: 'Incident not found' });

      const newAudit = [...(existing.auditLog || []), {
        action: `Updated status to ${status || 'modified'}`,
        by: req.user?.name || 'Dispatcher',
        timestamp: new Date()
      }];

      const newAiPlan = existing.aiTriagePlan ? {
        ...existing.aiTriagePlan,
        status: aiTriageStatus || existing.aiTriagePlan.status
      } : null;

      updatedIncident = seedData.updateIncident(id, {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedResources && { assignedResources }),
        ...(newAiPlan && { aiTriagePlan: newAiPlan }),
        auditLog: newAudit
      });
    }

    // Broadcast via Socket.IO
    const io = req.app.get('socketio');
    if (io) {
      io.emit('incident:updated', updatedIncident);
    }

    return res.json({ success: true, data: updatedIncident });
  } catch (error) {
    logger.error(`Error updating incident: ${error.message}`);
    return res.status(500).json({ error: 'Failed to update incident' });
  }
};

// Deploy AI Dispatch Action Plan
exports.deployAiDispatchPlan = async (req, res) => {
  try {
    const { id } = req.params;

    let incident;
    if (isDbConnected()) {
      incident = await Incident.findById(id);
    } else {
      incident = seedData.getIncidents().find(i => i._id === id || i.id === id);
    }

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const updatedStatus = 'DISPATCHED';
    const updatedAiPlan = {
      ...(incident.aiTriagePlan || {}),
      status: 'DEPLOYED'
    };

    let updatedIncident;
    if (isDbConnected()) {
      incident.status = updatedStatus;
      incident.aiTriagePlan = updatedAiPlan;
      incident.auditLog.push({
        action: 'AI Triage Plan Reviewed & Deployed by Command Dispatcher',
        by: req.user?.name || 'Command Dispatcher',
        timestamp: new Date()
      });
      updatedIncident = await incident.save();
    } else {
      updatedIncident = seedData.updateIncident(id, {
        status: updatedStatus,
        aiTriagePlan: updatedAiPlan,
        auditLog: [...(incident.auditLog || []), {
          action: 'AI Triage Plan Reviewed & Deployed by Command Dispatcher',
          by: req.user?.name || 'Command Dispatcher',
          timestamp: new Date()
        }]
      });
    }

    // Broadcast update
    const io = req.app.get('socketio');
    if (io) {
      io.emit('incident:updated', updatedIncident);
      io.emit('chat:broadcast', {
        channel: 'ai-dispatch',
        sender: { name: 'LERN Command AI', role: 'AI Assistant', isAI: true },
        text: `🚨 AI Dispatch Plan Deployed for Incident "${updatedIncident.title}". Emergency units notified.`,
        createdAt: new Date().toISOString()
      });
    }

    return res.json({ success: true, message: 'AI Dispatch Plan Deployed Successfully', data: updatedIncident });
  } catch (error) {
    logger.error(`Error deploying AI dispatch plan: ${error.message}`);
    return res.status(500).json({ error: 'Failed to deploy AI response plan' });
  }
};
