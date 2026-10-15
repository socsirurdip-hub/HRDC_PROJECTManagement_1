import api from './axios';
import type { LoginFormData } from '../types';

export const authApi = {
  login: (data: LoginFormData) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  register: (data: Record<string, unknown>) => api.post('/auth/register', data),
};

export const usersApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: Record<string, unknown>) => api.post('/auth/register', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  toggleStatus: (id: string) => api.patch(`/users/${id}/toggle-status`),
};

export const programsApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/programs', { params }),
  getById: (id: string) => api.get(`/programs/${id}`),
  create: (data: Record<string, unknown>) => api.post('/programs', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/programs/${id}`, data),
  delete: (id: string) => api.delete(`/programs/${id}`),
  getStats: () => api.get('/programs/stats/summary'),
};

export const traineesApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/trainees', { params }),
  getById: (id: string) => api.get(`/trainees/${id}`),
  create: (data: Record<string, unknown>) => api.post('/trainees', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/trainees/${id}`, data),
  delete: (id: string) => api.delete(`/trainees/${id}`),
  getDemographics: () => api.get('/trainees/stats/demographics'),
};

export const enrollmentsApi = {
  create: (data: Record<string, unknown>) => api.post('/enrollments', data),
  getByProgram: (programId: string, params?: Record<string, unknown>) =>
    api.get(`/enrollments/program/${programId}`, { params }),
  getByTrainee: (traineeId: string) => api.get(`/enrollments/trainee/${traineeId}`),
  update: (id: string, data: Record<string, unknown>) => api.put(`/enrollments/${id}`, data),
  submitFeedback: (id: string, data: Record<string, unknown>) =>
    api.post(`/enrollments/${id}/feedback`, data),
  getStats: () => api.get('/enrollments/stats'),
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getPerformance: () => api.get('/analytics/performance'),
};

export const reportsApi = {
  exportPrograms: (params?: Record<string, unknown>) =>
    api.get('/reports/programs', { params, responseType: 'blob' }),
  exportTrainees: (params?: Record<string, unknown>) =>
    api.get('/reports/trainees', { params, responseType: 'blob' }),
};

export const auditApi = {
  getLogs: (params?: Record<string, unknown>) => api.get('/audit', { params }),
};
