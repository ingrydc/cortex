import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// Layouts
import AppLayout from '@/components/layout/AppLayout'

// Pages
import LoginPage    from '@/pages/auth/LoginPage'
import Dashboard    from '@/pages/dashboard/Dashboard'
import SubjectPage  from '@/pages/subject/SubjectPage'
import CalendarPage from '@/pages/dashboard/CalendarPage'

// Rota protegida — redireciona para /login se não autenticado
function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />

      {/* App protegido */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"          element={<Dashboard />} />
        <Route path="disciplina/:id"     element={<SubjectPage />} />
        <Route path="calendario"         element={<CalendarPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
