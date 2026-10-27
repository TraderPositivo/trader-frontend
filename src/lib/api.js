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
  if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`)
  return data
}

export const api = {
  get:  (path)       => req(path),
  post: (path, body) => req(path, { method: 'POST', body: JSON.stringify(body) }),
}
