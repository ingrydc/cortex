import api from './api'

export const semestersService = {
  list:   ()         => api.get('/semesters'),
  create: (data)     => api.post('/semesters', data),
  update: (id, data) => api.patch(`/semesters/${id}`, data),
  remove: (id)       => api.delete(`/semesters/${id}`),
}
