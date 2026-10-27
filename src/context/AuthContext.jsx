import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const token = localStorage.getItem('ts_token')
      const userData = localStorage.getItem('ts_user')
      if (token && userData) setUser(JSON.parse(userData))
    } catch (_) {}
    setLoading(false)
  }, [])

  const login = (token, userData) => {
    localStorage.setItem('ts_token', token)
    localStorage.setItem('ts_user', JSON.stringify(userData))
    setUser(userData)
  }

  // atualiza os dados do usuário (ex.: plano renovado) sem novo login
  const atualizar = (userData) => {
    localStorage.setItem('ts_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('ts_token')
    localStorage.removeItem('ts_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, atualizar }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
