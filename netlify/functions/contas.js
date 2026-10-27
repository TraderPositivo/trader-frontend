import { db } from './_db.js'
import { verifyToken, wrap } from './_auth.js'

export const handler = wrap(async (event) => {
  const user = verifyToken(event)
  const sql = db()

  if (event.httpMethod === 'GET') {
    const rows = await sql`SELECT * FROM contas WHERE usuario_id = ${user.id} ORDER BY nome`
    return { statusCode: 200, body: JSON.stringify(rows) }
  }

  const body = JSON.parse(event.body || '{}')

  if (body.action === 'salvar') {
    const { id, nome, meta_diaria, stop_diario, meta_mensal, stop_mensal, operar_ativo,
            loss_limit_ciclo, custo_renovacao } = body
    if (!nome?.trim()) throw new Error('Nome é obrigatório')

    if (id) {
      await sql`
        UPDATE contas SET
          nome = ${nome}, meta_diaria = ${meta_diaria || 0}, stop_diario = ${stop_diario || 0},
          meta_mensal = ${meta_mensal || 0}, stop_mensal = ${stop_mensal || 0},
          operar_ativo = ${operar_ativo ? 1 : 0},
          loss_limit_ciclo = ${loss_limit_ciclo || 0}, custo_renovacao = ${custo_renovacao || 0}
        WHERE id = ${id} AND usuario_id = ${user.id}
      `
      return { statusCode: 200, body: JSON.stringify({ ok: true, id }) }
    } else {
      const [row] = await sql`
        INSERT INTO contas (usuario_id, nome, meta_diaria, stop_diario, meta_mensal, stop_mensal,
          operar_ativo, loss_limit_ciclo, custo_renovacao)
        VALUES (${user.id}, ${nome}, ${meta_diaria || 0}, ${stop_diario || 0},
          ${meta_mensal || 0}, ${stop_mensal || 0}, ${operar_ativo ? 1 : 0},
          ${loss_limit_ciclo || 0}, ${custo_renovacao || 0})
        RETURNING id
      `
      return { statusCode: 200, body: JSON.stringify({ ok: true, id: row.id }) }
    }
  }

  if (body.action === 'excluir') {
    const [conta] = await sql`SELECT id FROM contas WHERE id = ${body.id} AND usuario_id = ${user.id}`
    if (!conta) throw new Error('Conta não encontrada')
    await sql`DELETE FROM contas WHERE id = ${body.id}`
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  }

  if (body.action === 'iniciar_ciclo') {
    const { conta_id, data_inicio, saldo_inicio } = body
    const [conta] = await sql`SELECT id FROM contas WHERE id = ${conta_id} AND usuario_id = ${user.id}`
    if (!conta) throw new Error('Conta não encontrada')
    await sql`UPDATE ciclos SET data_fim = ${data_inicio} WHERE conta_id = ${conta_id} AND data_fim IS NULL`
    await sql`INSERT INTO ciclos (conta_id, data_inicio, saldo_inicio) VALUES (${conta_id}, ${data_inicio}, ${saldo_inicio || 0})`
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  }

  throw new Error('Ação inválida')
})
