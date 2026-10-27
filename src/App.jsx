import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Config from './pages/Config'
import Performance from './pages/Performance'
import Operar from './pages/Operar'
import Lancar from './pages/Lancar'
import Admin from './pages/Admin'
import Aluno from './pages/Aluno'

function Private({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  // guarda a página pedida para o login voltar até ela
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />
}

function AdminOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user?.role === 'admin' ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"       element={<Login />} />
      <Route path="/"            element={<Private><Dashboard /></Private>} />
      <Route path="/operar"      element={<Private><Operar /></Private>} />
      <Route path="/config"      element={<Private><Config /></Private>} />
      <Route path="/performance" element={<Private><Performance /></Private>} />
      <Route path="/lancar"      element={<Private><Lancar /></Private>} />
      <Route path="/aluno"       element={<Private><Aluno /></Private>} />
      <Route path="/admin"       element={<AdminOnly><Admin /></AdminOnly>} />
      <Route path="*"            element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
