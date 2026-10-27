const BASE = (import.meta.env.VITE_API_URL || 'https://trader-backend-2v2l.onrender.com') + '/api'

function getToken() {
  return localStorage.getItem('ts_token') || ''
}

async function req(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    ...(options.headers || {}),
  }
  const res = await fetch(`${BASE}/${path}`, { ...options, headers })
  const data = await res.json()
  // acesso do plano venceu: volta para a Área do aluno, que mostra como renovar
  if (data.codigo === 'ACESSO_VENCIDO') {
    try {
      const u = JSON.parse(localStorage.getItem('ts_user') || '{}')
      localStorage.setItem('ts_user', JSON.stringify({ ...u, acesso_liberado: false }))
    } catch (_) {}
    if (location.pathname !== '/aluno') location.assign('/aluno')
  }
  if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`)
  return data
}

export const api = {
  get:  (path)       => req(path),
  post: (path, body) => req(path, { method: 'POST', body: JSON.stringify(body) }),
}
