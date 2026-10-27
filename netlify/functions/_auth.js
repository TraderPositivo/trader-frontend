import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev-secret-TROQUE-em-producao'

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' })
}

export function verifyToken(event) {
  const auth = (event.headers?.authorization || event.headers?.Authorization || '').trim()
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth
  if (!token) throw Object.assign(new Error('Não autenticado'), { status: 401 })
  return jwt.verify(token, SECRET)
}

export function wrap(handler) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  }
  return async (event, context) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }
    try {
      const result = await handler(event, context)
      return { ...result, headers: { ...headers, ...(result.headers || {}) } }
    } catch (err) {
      const status = err.status || (err.name === 'JsonWebTokenError' ? 401 : 500)
      return { statusCode: status, headers, body: JSON.stringify({ erro: err.message }) }
    }
  }
}
