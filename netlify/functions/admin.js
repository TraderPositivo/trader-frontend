import bcrypt from 'bcryptjs'
import { db } from './_db.js'
import { verifyToken, wrap } from './_auth.js'

export const handler = wrap(async (event) => {
  const user = verifyToken(event)
  if (user.role !== 'admin') throw Object.assign(new Error('Acesso negado'), { status: 403 })

  const sql = db()

  if (event.httpMethod === 'GET') {
    const rows = await sql`
      SELECT u.id, u.nome, u.email, u.role, u.ativo, u.criado_em,
             COUNT(c.id) AS contas
      FROM usuarios u
      LEFT JOIN contas c ON c.usuario_id = u.id
      GROUP BY u.id
      ORDER BY u.criado_em DESC
    `
    return { statusCode: 200, body: JSON.stringify(rows) }
  }

  const body = JSON.parse(event.body || '{}')

  if (body.action === 'salvar_usuario') {
    const { id, nome, email, senha, role } = body
    if (!nome?.trim() || !email?.trim()) throw new Error('Nome e e-mail obrigatórios')

    if (id) {
      if (senha?.trim()) {
        const hash = await bcrypt.hash(senha, 10)
        await sql`UPDATE usuarios SET nome=${nome}, email=${email}, role=${role||'user'}, senha_hash=${hash} WHERE id=${id}`
      } else {
        await sql`UPDATE usuarios SET nome=${nome}, email=${email}, role=${role||'user'} WHERE id=${id}`
      }
      return { statusCode: 200, body: JSON.stringify({ ok: true }) }
    } else {
      if (!senha?.trim()) throw new Error('Senha obrigatória')
      const hash = await bcrypt.hash(senha, 10)
      const [row] = await sql`
        INSERT INTO usuarios (nome, email, senha_hash, role)
        VALUES (${nome}, ${email}, ${hash}, ${role||'user'})
        RETURNING id
      `
      return { statusCode: 200, body: JSON.stringify({ ok: true, id: row.id }) }
    }
  }

  if (body.action === 'toggle_usuario') {
    await sql`UPDATE usuarios SET ativo=${body.ativo} WHERE id=${body.id}`
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  }

  throw new Error('Ação inválida')
})
