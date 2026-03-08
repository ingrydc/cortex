import api from './api'

export const tasksService = {
  list:   (params)   => api.get('/tasks', { params }),
  create: (data)     => api.post('/tasks', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  remove: (id)       => api.delete(`/tasks/${id}`),
}

export const notesService = {
  list:   (semId, subjId)       => api.get(`/semesters/${semId}/subjects/${subjId}/notes`),
  create: (semId, subjId, data) => api.post(`/semesters/${semId}/subjects/${subjId}/notes`, data),
  update: (id, data)            => api.patch(`/notes/${id}`, data),
  remove: (id)                  => api.delete(`/notes/${id}`),
}
