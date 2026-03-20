import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Agents API
export const agentsAPI = {
  getAll: () => api.get('/agents'),
  getById: (id) => api.get(`/agents/${id}`),
  create: (data) => api.post('/agents', data),
  update: (id, data) => api.put(`/agents/${id}`, data),
  delete: (id) => api.delete(`/agents/${id}`),
};

// Documents API
export const documentsAPI = {
  getByAgent: (agentId) => api.get(`/agents/${agentId}/documents`),
  upload: (agentId, formData) => api.post(`/agents/${agentId}/documents/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  delete: (docId) => api.delete(`/documents/${docId}`),
};

// Training API
export const trainingAPI = {
  train: (agentId) => api.post(`/agents/${agentId}/train`),
  getStatus: (agentId) => api.get(`/agents/${agentId}/training-status`),
};

// Chat API
export const chatAPI = {
  sendMessage: (data) => api.post('/chat', data),
};

// Agent Testing API
export const testingAPI = {
  testAgent: (agentId, data) => api.post(`/agents/${agentId}/test`, data),
};

// Integration API
export const integrationAPI = {
  getIntegration: (agentId, type) => api.get(`/agents/${agentId}/integration/${type}`),
  getWidget: (agentId) => api.get(`/agents/${agentId}/widget.js`),
  downloadWordPressPlugin: (agentId, params) =>
    api.get(`/agents/${agentId}/integration/wordpress/plugin.zip`, {
      params,
      responseType: 'blob',
    }),
};

// Dashboard API
export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
};

// Conversations API
export const conversationsAPI = {
  getAll: () => api.get('/conversations'),
  getByAgent: (agentId) => api.get(`/agents/${agentId}/conversations`),
};

export default api;
