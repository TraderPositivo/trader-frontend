import { db } from './_db.js'
import { verifyToken, wrap } from './_auth.js'

export const handler = wrap(async (event) => {
  const user = verifyToken(event)
  const sql  = db()
  const qs   = Object.fromEntries(new URLSearchParams(event.rawQuery || ''))

  // Contas do usuário
  const contas = await sql`SELECT id, nome, plataforma FROM contas WHERE usuario_id=${user.id} AND ativa=1 ORDER BY nome`
  if (!contas.length) return { statusCode: 200, body: JSON.stringify({ contas: [], dados: null }) }

  const contaId = qs.conta_id ? parseInt(qs.conta_id) : contas[0].id
  const mes     = qs.mes || new Date().toISOString().slice(0, 7)   // YYYY-MM
  const inicio  = mes + '-01'
  const fim     = new Date(mes.split('-')[0], parseInt(mes.split('-')[1]), 0).toISOString().slice(0, 10)

  // Ops do período
  const ops = await sql`
    SELECT id, data_operacao, tipo, horario_entrada, horario_saida, pontos, resultado, custo, observacao
    FROM operacoes
    WHERE conta_id=${contaId} AND data_operacao BETWEEN ${inicio} AND ${fim}
    ORDER BY data_operacao, horario_entrada
  `

  if (!ops.length) return { statusCode: 200, body: JSON.stringify({ contas, dados: null, conta_id: contaId, mes }) }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const lucroTotal  = ops.reduce((s, o) => s + parseFloat(o.resultado), 0)
  const custoTotal  = ops.reduce((s, o) => s + parseFloat(o.custo || 0), 0)
  const brutoTotal  = lucroTotal + custoTotal
  const gains       = ops.filter(o => parseFloat(o.resultado) > 0)
  const losses      = ops.filter(o => parseFloat(o.resultado) < 0)
  const winRate     = ops.length ? (gains.length / ops.length) * 100 : 0
  const mediaGain   = gains.length  ? gains.reduce((s, o) => s + parseFloat(o.resultado), 0) / gains.length : 0
  const mediaLoss   = losses.length ? losses.reduce((s, o) => s + parseFloat(o.resultado), 0) / losses.length : 0
  const maxGain     = gains.length  ? Math.max(...gains.map(o => parseFloat(o.resultado))) : 0
  const maxLoss     = losses.length ? Math.min(...losses.map(o => parseFloat(o.resultado))) : 0

  // Por dia
  const porDia = {}
  ops.forEach(o => {
    const d = o.data_operacao.toISOString?.().slice(0,10) || String(o.data_operacao).slice(0,10)
    if (!porDia[d]) porDia[d] = 0
    porDia[d] += parseFloat(o.resultado)
  })
  const dias = Object.entries(porDia).sort(([a],[b]) => a.localeCompare(b))
  const resultadosDia = dias.map(([,v]) => v)
  const melhorDia  = resultadosDia.length ? Math.max(...resultadosDia) : 0
  const piorDia    = resultadosDia.length ? Math.min(...resultadosDia) : 0

  // Sequência por dia (para dots)
  const seqDia = dias.map(([d, v]) => ({ data: d, resultado: parseFloat(v.toFixed(2)), tipo: v > 0 ? 'G' : v < 0 ? 'L' : 'N' }))

  // Melhor e pior sequência de dias
  let melhorSeq = 0, piorSeq = 0, curPos = 0, curNeg = 0
  resultadosDia.forEach(v => {
    if (v > 0) { curPos++; curNeg = 0; melhorSeq = Math.max(melhorSeq, curPos) }
    else if (v < 0) { curNeg++; curPos = 0; piorSeq = Math.max(piorSeq, curNeg) }
    else { curPos = 0; curNeg = 0 }
  })

  // Sequência atual (último dia)
  const ultimo = resultadosDia[resultadosDia.length - 1] || 0
  let seqAtual = 0
  if (ultimo > 0) seqAtual = curPos
  else if (ultimo < 0) seqAtual = -curNeg

  // Evolução acumulada
  let acum = 0
  const evolucao = dias.map(([d, v]) => { acum += v; return { data: d, valor: parseFloat(acum.toFixed(2)) } })

  // Ultimas 30 operações (para dots finos)
  const ultimas30 = [...ops].reverse().slice(0, 30).map(o => parseFloat(o.resultado) > 0 ? 'G' : parseFloat(o.resultado) < 0 ? 'L' : 'N').reverse()

  return {
    statusCode: 200,
    body: JSON.stringify({
      contas, conta_id: contaId, mes,
      dados: {
        lucro_total:   parseFloat(lucroTotal.toFixed(2)),
        bruto_total:   parseFloat(brutoTotal.toFixed(2)),
        custo_total:   parseFloat(custoTotal.toFixed(2)),
        total_ops:     ops.length,
        gains:         gains.length,
        losses:        losses.length,
        win_rate:      parseFloat(winRate.toFixed(1)),
        media_gain:    parseFloat(mediaGain.toFixed(2)),
        media_loss:    parseFloat(mediaLoss.toFixed(2)),
        max_gain:      parseFloat(maxGain.toFixed(2)),
        max_loss:      parseFloat(maxLoss.toFixed(2)),
        melhor_dia:    parseFloat(melhorDia.toFixed(2)),
        pior_dia:      parseFloat(piorDia.toFixed(2)),
        seq_atual:     seqAtual,
        melhor_seq:    melhorSeq,
        pior_seq:      piorSeq,
        seq_dia:       seqDia,
        ultimas30,
        evolucao,
        ops: ops.map(o => ({
          ...o,
          data_operacao: o.data_operacao.toISOString?.().slice(0,10) || String(o.data_operacao).slice(0,10),
          resultado: parseFloat(o.resultado),
          pontos:    parseFloat(o.pontos),
          custo:     parseFloat(o.custo || 0),
        })),
      },
    }),
  }
})
