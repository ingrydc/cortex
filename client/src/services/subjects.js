import api from './api'

export const subjectsService = {
  list:          (semesterId)       => api.get(`/semesters/${semesterId}/subjects`),
  listAll:       ()                 => api.get('/subjects'),
  getOne:        (id)               => api.get(`/subjects/${id}`),
  create:        (semesterId, data) => api.post(`/semesters/${semesterId}/subjects`, data),
  update:        (id, data)         => api.patch(`/subjects/${id}`, data),
  remove:        (id)               => api.delete(`/subjects/${id}`),
  getMaterials:  (id)               => api.get(`/subjects/${id}/materials`),
  uploadMaterial:(id, form)         => api.post(`/subjects/${id}/materials`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getNotes:      (id)               => api.get(`/subjects/${id}/notes`),
  createNote:    (id, data)         => api.post(`/subjects/${id}/notes`, data),
}
