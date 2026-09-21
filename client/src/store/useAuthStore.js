import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { accessToken, user } = response.data;
      
      localStorage.setItem('token', accessToken);
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Authentication failed. Check credentials.';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  register: async (name, email, password, role = 'Citizen') => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/auth/register', { name, email, password, role });
      const { accessToken, user } = response.data;

      localStorage.setItem('token', accessToken);
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration failed.';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error on server:', err);
    } finally {
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  init: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const response = await api.get('/api/auth/me');
      set({ user: response.data.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      console.warn('Session init failed. Clearing token:', err.message);
      localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export default useAuthStore;
