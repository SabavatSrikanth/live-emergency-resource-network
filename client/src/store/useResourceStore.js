import { create } from 'zustand';
import api from '../services/api';
import { socket } from '../services/socket';

const useResourceStore = create((set, get) => ({
  resources: [],
  isLoading: false,
  error: null,

  fetchResources: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/resources');
      if (response.data.success) {
        set({ resources: response.data.data, isLoading: false });
      }
    } catch (err) {
      console.error('Failed to fetch resources:', err);
      set({ error: 'Could not load resources', isLoading: false });
    }
  },

  updateResource: async (id, available, status) => {
    try {
      const response = await api.patch(`/api/resources/${id}`, { available, status });
      if (response.data.success) {
        const updated = response.data.data;
        set((state) => ({
          resources: state.resources.map((r) => ((r._id || r.id) === id ? updated : r))
        }));
      }
    } catch (err) {
      console.error('Failed to update resource:', err);
    }
  },

  initSocketListeners: () => {
    socket.off('resource:updated');
    socket.on('resource:updated', (updatedResource) => {
      set((state) => ({
        resources: state.resources.map((r) =>
          (r._id || r.id) === (updatedResource._id || updatedResource.id) ? updatedResource : r
        )
      }));
    });
  }
}));

export default useResourceStore;
