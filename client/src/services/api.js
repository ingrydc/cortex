import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Injeta o token JWT em toda requisição automaticamente
api.interceptors.request.use(config => {
  const token = localStorage.getItem('cortex-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Trata erros globais (ex: token expirado → redireciona para login)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cortex-token')
      localStorage.removeItem('cortex-user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
