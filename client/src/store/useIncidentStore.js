import { create } from 'zustand';
import api from '../services/api';
import { socket } from '../services/socket';

const useIncidentStore = create((set, get) => ({
  incidents: [],
  selectedIncident: null,
  isLoading: false,
  error: null,
  activeFilter: 'ALL',
  selectedRadiusKm: 25,

  setFilter: (filter) => set({ activeFilter: filter }),
  setRadius: (radius) => set({ selectedRadiusKm: radius }),
  setSelectedIncident: (incident) => set({ selectedIncident: incident }),

  fetchIncidents: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/incidents');
      if (response.data.success) {
        set({ incidents: response.data.data, isLoading: false });
      }
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
      set({ error: 'Could not load emergency incidents', isLoading: false });
    }
  },

  createIncident: async (incidentData) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/api/incidents', incidentData);
      if (response.data.success) {
        const newInc = response.data.data;
        set((state) => ({
          incidents: [newInc, ...state.incidents.filter((i) => (i._id || i.id) !== (newInc._id || newInc.id))],
          isLoading: false
        }));
        return newInc;
      }
    } catch (err) {
      console.error('Error reporting incident:', err);
      set({ isLoading: false });
      throw err;
    }
  },

  updateIncidentStatus: async (id, status, priority) => {
    try {
      const response = await api.patch(`/api/incidents/${id}`, { status, priority });
      if (response.data.success) {
        const updated = response.data.data;
        set((state) => ({
          incidents: state.incidents.map((i) => ((i._id || i.id) === id ? updated : i))
        }));
      }
    } catch (err) {
      console.error('Failed to update incident:', err);
    }
  },

  deployAiPlan: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.post(`/api/incidents/${id}/ai-dispatch`);
      if (response.data.success) {
        const updated = response.data.data;
        set((state) => ({
          incidents: state.incidents.map((i) => ((i._id || i.id) === id ? updated : i)),
          isLoading: false
        }));
        return updated;
      }
    } catch (err) {
      console.error('Failed to deploy AI plan:', err);
      set({ isLoading: false });
      throw err;
    }
  },

  initSocketListeners: () => {
    socket.off('incident:created');
    socket.off('incident:updated');

    socket.on('incident:created', (newIncident) => {
      set((state) => ({
        incidents: [newIncident, ...state.incidents.filter((i) => (i._id || i.id) !== (newIncident._id || newIncident.id))]
      }));
    });

    socket.on('incident:updated', (updatedIncident) => {
      set((state) => ({
        incidents: state.incidents.map((i) =>
          (i._id || i.id) === (updatedIncident._id || updatedIncident.id) ? updatedIncident : i
        )
      }));
    });
  }
}));

export default useIncidentStore;
