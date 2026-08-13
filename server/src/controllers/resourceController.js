const Resource = require('../models/Resource');
const seedData = require('../utils/seedData');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

const isDbConnected = () => mongoose.connection.readyState === 1;

// Get all emergency resources
exports.getResources = async (req, res) => {
  try {
    const { type, status } = req.query;

    if (isDbConnected()) {
      let query = {};
      if (type) query.type = type;
      if (status) query.status = status;
      let resources = await Resource.find(query).sort({ createdAt: -1 });
      if (resources.length === 0 && !type && !status) {
        const initialSeeds = seedData.getResources();
        try {
          await Resource.insertMany(initialSeeds.map(r => {
            const { _id, ...rest } = r;
            return rest;
          }));
          resources = await Resource.find(query).sort({ createdAt: -1 });
        } catch (seedErr) {
          logger.warn(`Mongo insertMany seed skipped: ${seedErr.message}`);
          resources = seedData.getResources();
        }
      }
      return res.json({ success: true, count: resources.length, data: resources });
    }

    let resources = seedData.getResources();
    if (type) resources = resources.filter(r => r.type === type);
    if (status) resources = resources.filter(r => r.status === status);
    return res.json({ success: true, count: resources.length, data: resources });
  } catch (error) {
    logger.error(`Error fetching resources: ${error.message}`);
    return res.status(500).json({ error: 'Failed to fetch resources' });
  }
};

// Create new resource entry
exports.createResource = async (req, res) => {
  try {
    const { name, type, quantity, available, location, provider } = req.body;

    if (!name || !type || !quantity) {
      return res.status(400).json({ error: 'Name, type, and quantity are required.' });
    }

    const lat = location?.coordinates?.lat || (40.7128 + (Math.random() - 0.5) * 0.04);
    const lng = location?.coordinates?.lng || (-74.0060 + (Math.random() - 0.5) * 0.04);

    const resourceData = {
      name,
      type,
      quantity: Number(quantity),
      available: available !== undefined ? Number(available) : Number(quantity),
      status: 'AVAILABLE',
      location: {
        address: location?.address || 'Central Operations Depot',
        coordinates: { lat, lng }
      },
      provider: {
        name: provider?.name || 'Local NGO Unit',
        contact: provider?.contact || '555-DISPATCH'
      }
    };

    let newResource;
    if (isDbConnected()) {
      newResource = await Resource.create(resourceData);
    } else {
      newResource = {
        _id: 'res-' + Date.now(),
        ...resourceData,
        createdAt: new Date().toISOString()
      };
      seedData.addResource(newResource);
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit('resource:updated', newResource);
    }

    return res.status(201).json({ success: true, data: newResource });
  } catch (error) {
    logger.error(`Error creating resource: ${error.message}`);
    return res.status(500).json({ error: 'Failed to add resource' });
  }
};

// Update/allocate resource quantity or availability
exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { available, status, assignedIncidentId } = req.body;

    let updatedResource;
    if (isDbConnected()) {
      const resource = await Resource.findById(id);
      if (!resource) return res.status(404).json({ error: 'Resource not found' });

      if (available !== undefined) resource.available = Number(available);
      if (status) resource.status = status;
      if (assignedIncidentId !== undefined) resource.assignedIncidentId = assignedIncidentId;

      updatedResource = await resource.save();
    } else {
      const existing = seedData.getResources().find(r => r._id === id || r.id === id);
      if (!existing) return res.status(404).json({ error: 'Resource not found' });

      updatedResource = seedData.updateResource(id, {
        ...(available !== undefined && { available: Number(available) }),
        ...(status && { status }),
        ...(assignedIncidentId !== undefined && { assignedIncidentId })
      });
    }

    const io = req.app.get('socketio');
    if (io) {
      io.emit('resource:updated', updatedResource);
    }

    return res.json({ success: true, data: updatedResource });
  } catch (error) {
    logger.error(`Error updating resource: ${error.message}`);
    return res.status(500).json({ error: 'Failed to update resource' });
  }
};
