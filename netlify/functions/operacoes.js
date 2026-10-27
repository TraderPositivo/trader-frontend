import { db } from './_db.js'
import { verifyToken, wrap } from './_auth.js'

export const handler = wrap(async (event) => {
  const user = verifyToken(event)
  const sql = db()

  const qs = Object.fromEntries(new URLSearchParams(event.rawQuery || ''))
  const conta_id = qs.conta_id

  if (event.httpMethod === 'GET') {
    if (!conta_id) throw new Error('conta_id obrigatório')
    const [conta] = await sql`SELECT id FROM contas WHERE id = ${conta_id} AND usuario_id = ${user.id}`
    if (!conta) throw new Error('Conta não encontrada')

    const rows = qs.data
      ? await sql`SELECT * FROM operacoes WHERE conta_id = ${conta_id} AND data_operacao = ${qs.data} ORDER BY horario_entrada`
      : await sql`SELECT * FROM operacoes WHERE conta_id = ${conta_id} ORDER BY data_operacao DESC, horario_entrada DESC LIMIT 200`

    return { statusCode: 200, body: JSON.stringify(rows) }
  }

  const body = JSON.parse(event.body || '{}')

  if (body.action === 'salvar') {
    const { conta_id: cid, data_operacao, tipo, horario_entrada, horario_saida,
            pontos, resultado, custo, observacao } = body
    const [conta] = await sql`SELECT id FROM contas WHERE id = ${cid} AND usuario_id = ${user.id}`
    if (!conta) throw new Error('Conta não encontrada')

    const [row] = await sql`
      INSERT INTO operacoes (conta_id, data_operacao, tipo, horario_entrada, horario_saida, pontos, resultado, custo, observacao)
      VALUES (${cid}, ${data_operacao}, ${tipo}, ${horario_entrada}, ${horario_saida || null},
              ${pontos || 0}, ${resultado || 0}, ${custo || 0}, ${observacao || null})
      RETURNING id
    `
    return { statusCode: 200, body: JSON.stringify({ ok: true, id: row.id }) }
  }

  if (body.action === 'excluir') {
    await sql`
      DELETE FROM operacoes WHERE id = ${body.id}
        AND conta_id IN (SELECT id FROM contas WHERE usuario_id = ${user.id})
    `
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  }

  if (body.action === 'importar') {
    const { conta_id: cid, ops } = body
    if (!Array.isArray(ops) || !ops.length) throw new Error('Nenhuma operação para importar')
    const [conta] = await sql`SELECT id FROM contas WHERE id = ${cid} AND usuario_id = ${user.id}`
    if (!conta) throw new Error('Conta não encontrada')

    let inserted = 0
    for (const op of ops) {
      try {
        await sql`
          INSERT INTO operacoes (conta_id, data_operacao, tipo, horario_entrada, horario_saida, pontos, resultado, custo)
          VALUES (${cid}, ${op.data_operacao}, ${op.tipo}, ${op.horario_entrada}, ${op.horario_saida || null},
                  ${op.pontos || 0}, ${op.resultado || 0}, ${op.custo || 0})
          ON CONFLICT DO NOTHING
        `
        inserted++
      } catch (_) { /* duplicata — ignora */ }
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true, inserted }) }
  }

  throw new Error('Ação inválida')
})
