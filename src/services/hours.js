import api from './api'

export const hoursService = {
  summary:        ()         => api.get('/hours/summary'),
  listActivities: (params)   => api.get('/hours/activities', { params }),
  create:         (data)     => api.post('/hours/activities', data),
  update:         (id, data) => api.patch(`/hours/activities/${id}`, data),
  remove:         (id)       => api.delete(`/hours/activities/${id}`),
  setGoals:       (goals)    => api.put('/hours/goals', { goals }),
}
