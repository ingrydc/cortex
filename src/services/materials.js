import api from './api'

export const materialsService = {
  list:   (semId, subjId)       => api.get(`/semesters/${semId}/subjects/${subjId}/materials`),
  upload: (semId, subjId, form) => api.post(
    `/semesters/${semId}/subjects/${subjId}/materials`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  ),
  update: (id, data) => api.patch(`/materials/${id}`, data),
  remove: (id)       => api.delete(`/materials/${id}`),
}
