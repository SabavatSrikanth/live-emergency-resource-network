// In-Memory Data Store & Seed Initializer for LERN

const initialIncidents = [
  {
    _id: 'inc-101',
    title: 'Residential Structure Fire',
    category: 'Fire',
    description: '2-story residential house showing thick black smoke and active flames. 4 occupants evacuated.',
    priority: 'CRITICAL',
    status: 'RESPONDING',
    location: {
      address: '122 Elm St, Sector 4',
      coordinates: { lat: 40.7142, lng: -74.0064 }
    },
    reporter: { name: 'Sarah Jenkins', role: 'Citizen', contact: '555-0192' },
    assignedResources: [
      { resourceId: 'res-201', name: 'Metro Engine Unit 4', type: 'Fire Tenders', qty: 2 }
    ],
    aiTriagePlan: {
      status: 'PROPOSED',
      summary: 'Dispatch 2 fire tenders from NGO station and request 5 volunteers for perimeter route clearance.',
      confidenceScore: 98,
      recommendedActions: [
        'Establish 200m safety perimeter around Elm St.',
        'Alert St. Jude Emergency Ward for burn victim triage capability.',
        'Deploy Red Cross mobile supply unit.'
      ],
      recommendedResources: [
        { type: 'Fire Tenders', qty: 2 },
        { type: 'Ambulances', qty: 1 }
      ]
    },
    auditLog: [
      { action: 'Report Filed', by: 'Sarah Jenkins', timestamp: new Date(Date.now() - 3000000) },
      { action: 'AI Triage Generated', by: 'LERN Command AI', timestamp: new Date(Date.now() - 2800000) }
    ],
    createdAt: new Date(Date.now() - 3000000).toISOString()
  },
  {
    _id: 'inc-102',
    title: 'Severe Flash Flood & Waterlogging',
    category: 'Flood',
    description: 'Underpass flooded with 4ft standing water. 2 vehicles stranded, occupants on roof.',
    priority: 'HIGH',
    status: 'VERIFYING',
    location: {
      address: 'River Road Bridge Underpass',
      coordinates: { lat: 40.7210, lng: -74.0150 }
    },
    reporter: { name: 'Officer Miller', role: 'Volunteer', contact: '555-0348' },
    assignedResources: [],
    aiTriagePlan: {
      status: 'PROPOSED',
      summary: 'Deploy aquatic rescue boat team and redirect northbound traffic via 5th Avenue detour.',
      confidenceScore: 94,
      recommendedActions: [
        'Deploy inflatable rescue boat team from Central Squad.',
        'Issue geo-fence emergency alert to drivers within 2km radius.'
      ],
      recommendedResources: [
        { type: 'Rescue Squads', qty: 1 }
      ]
    },
    auditLog: [
      { action: 'Report Filed', by: 'Officer Miller', timestamp: new Date(Date.now() - 1800000) }
    ],
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    _id: 'inc-103',
    title: 'Medical Emergency (Cardiac Distress)',
    category: 'Medical',
    description: 'Elderly individual collapsed on subway platform. Bystander administering CPR.',
    priority: 'CRITICAL',
    status: 'DISPATCHED',
    location: {
      address: 'Metro Central Station 4',
      coordinates: { lat: 40.7085, lng: -74.0012 }
    },
    reporter: { name: 'Station Master', role: 'Citizen', contact: '555-0812' },
    assignedResources: [
      { resourceId: 'res-202', name: 'Rapid Response ALS Ambulance #12', type: 'Ambulances', qty: 1 }
    ],
    aiTriagePlan: {
      status: 'DEPLOYED',
      summary: 'ALS Ambulance dispatched. Destination hospital notified for immediate trauma bay pre-activation.',
      confidenceScore: 99,
      recommendedActions: [
        'Maintain AED dispatch protocol.',
        'Pre-reserve ICU trauma bed at General Hospital.'
      ],
      recommendedResources: [
        { type: 'Ambulances', qty: 1 },
        { type: 'Hospital Beds', qty: 1 }
      ]
    },
    auditLog: [
      { action: 'Report Filed', by: 'Station Master', timestamp: new Date(Date.now() - 1200000) },
      { action: 'ALS Ambulance Dispatched', by: 'Dispatcher Dave', timestamp: new Date(Date.now() - 900000) }
    ],
    createdAt: new Date(Date.now() - 1200000).toISOString()
  },
  {
    _id: 'inc-104',
    title: 'Debris & Tree Blockade on Highway',
    category: 'Debris',
    description: 'Storm downing large pine tree across main arterial exit lane. Causing 2-mile backup.',
    priority: 'MEDIUM',
    status: 'APPROVED',
    location: {
      address: 'Highway 10 Exit 4 Northbound',
      coordinates: { lat: 40.7300, lng: -73.9920 }
    },
    reporter: { name: 'Dept of Transport', role: 'Admin', contact: '555-0010' },
    assignedResources: [],
    aiTriagePlan: {
      status: 'PROPOSED',
      summary: 'Dispatch municipal heavy equipment crew and request volunteer traffic wardens.',
      confidenceScore: 91,
      recommendedActions: [
        'Deploy heavy chainsaw team.',
        'Place temporary flare warning cone line.'
      ],
      recommendedResources: []
    },
    auditLog: [
      { action: 'Report Filed', by: 'Dept of Transport', timestamp: new Date(Date.now() - 2500000) }
    ],
    createdAt: new Date(Date.now() - 2500000).toISOString()
  }
];

const initialResources = [
  {
    _id: 'res-201',
    name: 'St. Jude Medical Center ICU Beds',
    type: 'Hospital Beds',
    quantity: 40,
    available: 12,
    status: 'AVAILABLE',
    location: { address: '500 Medical Plaza', coordinates: { lat: 40.7180, lng: -74.0030 } },
    provider: { name: 'St. Jude Hospital', contact: '555-9000' }
  },
  {
    _id: 'res-202',
    name: 'Rapid Response ALS Ambulances',
    type: 'Ambulances',
    quantity: 15,
    available: 5,
    status: 'AVAILABLE',
    location: { address: 'Central Dispatch Depot B', coordinates: { lat: 40.7100, lng: -74.0090 } },
    provider: { name: 'Emergency EMS', contact: '555-9110' }
  },
  {
    _id: 'res-203',
    name: 'Municipal Heavy Fire Tenders',
    type: 'Fire Tenders',
    quantity: 8,
    available: 3,
    status: 'AVAILABLE',
    location: { address: 'Fire Station #7', coordinates: { lat: 40.7150, lng: -74.0040 } },
    provider: { name: 'Metro Fire Dept', contact: '555-9119' }
  },
  {
    _id: 'res-204',
    name: 'Disaster Relief Rescue Squads',
    type: 'Rescue Squads',
    quantity: 12,
    available: 8,
    status: 'AVAILABLE',
    location: { address: 'Red Cross HQ Sector 2', coordinates: { lat: 40.7250, lng: -74.0110 } },
    provider: { name: 'NGO Alliance', contact: '555-4321' }
  },
  {
    _id: 'res-205',
    name: 'Emergency High-Capacity Shelters',
    type: 'Emergency Shelters',
    quantity: 500,
    available: 340,
    status: 'AVAILABLE',
    location: { address: 'Civic Arena Shelter', coordinates: { lat: 40.7050, lng: -74.0140 } },
    provider: { name: 'City Relief Office', contact: '555-8888' }
  }
];

const initialMessages = [
  {
    _id: 'msg-301',
    channel: 'ai-dispatch',
    sender: { name: 'LERN Command AI', role: 'AI Assistant', isAI: true },
    text: 'LERN Emergency Agent online. Monitoring active incidents, geospatial feeds, and resource reservations.',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    _id: 'msg-302',
    channel: 'incident-coordination',
    sender: { name: 'Dispatcher Dave', role: 'Dispatcher', isAI: false },
    text: 'Units respond: Incident #101 on Elm St has been escalated to Critical. Fire tender unit #201 is en route.',
    createdAt: new Date(Date.now() - 2400000).toISOString()
  },
  {
    _id: 'msg-303',
    channel: 'volunteer-broadcast',
    sender: { name: 'Volunteer Lead Sarah', role: 'Volunteer', isAI: false },
    text: 'Requesting 5 volunteers near Sector 4 to assist with safety perimeter around Elm St residential fire.',
    createdAt: new Date(Date.now() - 1500000).toISOString()
  }
];

// In-Memory dynamic cache store
let incidentsStore = [...initialIncidents];
let resourcesStore = [...initialResources];
let messagesStore = [...initialMessages];

module.exports = {
  incidentsStore,
  resourcesStore,
  messagesStore,
  getIncidents: () => incidentsStore,
  addIncident: (inc) => {
    incidentsStore.unshift(inc);
    return inc;
  },
  updateIncident: (id, updates) => {
    const idx = incidentsStore.findIndex(i => i._id === id || i.id === id);
    if (idx !== -1) {
      incidentsStore[idx] = { ...incidentsStore[idx], ...updates };
      return incidentsStore[idx];
    }
    return null;
  },
  getResources: () => resourcesStore,
  addResource: (res) => {
    resourcesStore.unshift(res);
    return res;
  },
  updateResource: (id, updates) => {
    const idx = resourcesStore.findIndex(r => r._id === id || r.id === id);
    if (idx !== -1) {
      resourcesStore[idx] = { ...resourcesStore[idx], ...updates };
      return resourcesStore[idx];
    }
    return null;
  },
  getMessages: (channel) => {
    if (!channel) return messagesStore;
    return messagesStore.filter(m => m.channel === channel);
  },
  addMessage: (msg) => {
    messagesStore.push(msg);
    return msg;
  }
};
