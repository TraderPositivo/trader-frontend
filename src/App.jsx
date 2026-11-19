import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Config from './pages/Config'
import Performance from './pages/Performance'
import Operar from './pages/Operar'
import Lancar from './pages/Lancar'
import Admin from './pages/Admin'
import Aluno from './pages/Aluno'
import Financeiro from './pages/Financeiro'

function Private({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  // guarda a página pedida para o login voltar até ela
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />
}

// GesRisk Trader: só com o plano em dia. acesso_liberado ausente (sessão antiga)
// deixa passar; o servidor confere de novo em cada chamada.
function ComAcesso({ children }) {
  const { user } = useAuth()
  if (user && user.role !== 'admin' && user.acesso_liberado === false) return <Navigate to="/aluno" replace />
  return children
}

function AdminOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user?.role === 'admin' ? children : <Navigate to="/" replace />
}

function HomeRoute() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Landing />
  return <ComAcesso><Dashboard /></ComAcesso>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"       element={<Login />} />
      <Route path="/"            element={<HomeRoute />} />
      <Route path="/operar"      element={<Private><ComAcesso><Operar /></ComAcesso></Private>} />
      <Route path="/config"      element={<Private><ComAcesso><Config /></ComAcesso></Private>} />
      <Route path="/performance" element={<Private><ComAcesso><Performance /></ComAcesso></Private>} />
      <Route path="/lancar"      element={<Private><ComAcesso><Lancar /></ComAcesso></Private>} />
      <Route path="/financeiro"   element={<Private><ComAcesso><Financeiro /></ComAcesso></Private>} />
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
