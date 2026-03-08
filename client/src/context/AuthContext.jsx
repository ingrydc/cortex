import { createContext, useContext, useState } from 'react'
import api from '@/services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(() => JSON.parse(localStorage.getItem('cortex-user')  || 'null'))
  const [token, setToken] = useState(() => localStorage.getItem('cortex-token') || null)

  // ── Login ──
  async function login(email, password) {
    // Demo local — funciona sem back-end rodando
    if (email === 'demo@cortex.app' && password === '12345678') {
      const mockUser  = { _id: 'demo', name: 'Maria Vieira', email, course: 'Eng. de Software' }
      const mockToken = 'demo-token-123'
      _persist(mockUser, mockToken)
      return mockUser
    }

    const { data } = await api.post('/auth/login', { email, password })
    _persist(data.user, data.token)
    return data.user
  }

  // ── Registro ──
  async function register({ name, email, password, course }) {
    const { data } = await api.post('/auth/register', { name, email, password, course })
    _persist(data.user, data.token)
    return data.user
  }

  // ── Atualizar dados do usuário (nome, curso etc.) ──
  async function updateProfile(payload) {
    const { data } = await api.patch('/auth/me', payload)
    const updated = { ...user, ...data.user }
    setUser(updated)
    localStorage.setItem('cortex-user', JSON.stringify(updated))
    return updated
  }

  // ── Logout ──
  function logout() {
    setUser(null)
    setToken(null)
    localStorage.removeItem('cortex-user')
    localStorage.removeItem('cortex-token')
  }

  function _persist(u, t) {
    setUser(u)
    setToken(t)
    localStorage.setItem('cortex-user',  JSON.stringify(u))
    localStorage.setItem('cortex-token', t)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
