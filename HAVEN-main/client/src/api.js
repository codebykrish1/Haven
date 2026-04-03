import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('haven_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Worker
export const getProfile = () => api.get('/workers/profile');
export const updateProfile = (data) => api.patch('/workers/profile', data);
export const getDashboard = () => api.get('/workers/dashboard');
export const getCalendar = (month, year) =>
  api.get('/workers/calendar', { params: { month, year } });
export const getBadges = () => api.get('/workers/badges');

// Policies
export const purchasePolicy = (data) => api.post('/policies', data);
export const getMyPolicies = () => api.get('/policies/my');
export const getPolicyById = (id) => api.get(`/policies/${id}`);
export const activateHourly = (data) => api.post('/policies/hourly/activate', data);
export const deactivateHourly = () => api.patch('/policies/hourly/deactivate');
export const pausePolicy = (id, data) => api.patch(`/policies/${id}/pause`, data);

// Claims
export const getMyClaims = (status) =>
  api.get('/claims/my', { params: status ? { status } : {} });
export const getClaimById = (id) => api.get(`/claims/${id}`);
export const quickClaim = (data) => api.post('/claims/quick', data);
export const approveClaim = (id) => api.patch(`/claims/${id}/approve`);
export const payClaim = (id) => api.patch(`/claims/${id}/pay`);
export const flagClaim = (id, data) => api.patch(`/claims/${id}/flag`, data);

// Disruptions
export const getAllDisruptions = (params) => api.get('/disruptions', { params });
export const getDisruptionById = (id) => api.get(`/disruptions/${id}`);
export const createDisruption = (data) => api.post('/disruptions', data);

// SOS
export const triggerSOS = (data) => api.post('/sos', data);
export const getMySOSEvents = () => api.get('/sos/my');
export const resolveSOS = (id) => api.patch(`/sos/${id}/resolve`);

export default api;
