const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');

router.get('/', incidentController.getIncidents);
router.post('/', incidentController.createIncident);
router.patch('/:id', incidentController.updateIncident);
router.post('/:id/ai-dispatch', incidentController.deployAiDispatchPlan);

module.exports = router;
