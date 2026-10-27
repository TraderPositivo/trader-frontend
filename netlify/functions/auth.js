import bcrypt from 'bcryptjs'
import { db } from './_db.js'
import { signToken, wrap } from './_auth.js'

export const handler = wrap(async (event) => {
  const body = JSON.parse(event.body || '{}')
  const sql = db()

  if (body.action === 'login') {
    const { email, senha } = body
    if (!email || !senha) throw new Error('E-mail e senha obrigatórios')

    const rows = await sql`SELECT * FROM usuarios WHERE email = ${email} AND ativo = 1`
    const user = rows[0]
    if (!user || !await bcrypt.compare(senha, user.senha_hash)) {
      throw Object.assign(new Error('E-mail ou senha incorretos'), { status: 401 })
    }

    const token = signToken({ id: user.id, role: user.role })
    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        usuario: { id: user.id, nome: user.nome, email: user.email, role: user.role }
      })
    }
  }

  if (body.action === 'me') {
    // Retorna dados do usuário a partir do token (usado no reload)
    const { verifyToken } = await import('./_auth.js')
    const decoded = verifyToken(event)
    const rows = await sql`SELECT id, nome, email, role FROM usuarios WHERE id = ${decoded.id}`
    if (!rows[0]) throw Object.assign(new Error('Usuário não encontrado'), { status: 404 })
    return { statusCode: 200, body: JSON.stringify(rows[0]) }
  }

  throw new Error('Ação inválida')
})
