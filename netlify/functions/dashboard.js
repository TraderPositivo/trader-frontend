import { db } from './_db.js'
import { verifyToken, wrap } from './_auth.js'

export const handler = wrap(async (event) => {
  const user = verifyToken(event)
  const sql = db()
  const hoje = new Date().toISOString().slice(0, 10)

  const contas = await sql`
    SELECT * FROM contas WHERE usuario_id = ${user.id} AND ativa = 1 ORDER BY nome
  `

  const result = await Promise.all(contas.map(async (conta) => {
    // Ciclo ativo
    const ciclos = await sql`
      SELECT data_inicio FROM ciclos
      WHERE conta_id = ${conta.id} AND data_fim IS NULL
      ORDER BY data_inicio DESC LIMIT 1
    `
    const periodoIni = ciclos[0]
      ? new Date(ciclos[0].data_inicio).toISOString().slice(0, 10)
      : hoje.slice(0, 7) + '-01'

    // Totais do ciclo
    const [resumo] = await sql`
      SELECT
        COALESCE(SUM(resultado), 0)                    AS lucro_ciclo,
        COALESCE(SUM(custo), 0)                        AS custo_ciclo,
        COUNT(DISTINCT data_operacao)                  AS pregoes,
        COUNT(*) FILTER (WHERE resultado > 0)          AS gains,
        COUNT(*) FILTER (WHERE resultado < 0)          AS losses
      FROM operacoes
      WHERE conta_id = ${conta.id}
        AND data_operacao BETWEEN ${periodoIni} AND ${hoje}
    `

    // Hoje
    const [hojeRow] = await sql`
      SELECT
        COALESCE(SUM(resultado), 0) AS lucro_hoje,
        COALESCE(SUM(custo), 0)    AS custo_hoje,
        COUNT(*)                   AS ops_hoje
      FROM operacoes
      WHERE conta_id = ${conta.id} AND data_operacao = ${hoje}
    `

    const lucroCiclo  = parseFloat(resumo.lucro_ciclo)
    const lucroHoje   = parseFloat(hojeRow.lucro_hoje)
    const opsHoje     = parseInt(hojeRow.ops_hoje)
    const lossLimit   = parseFloat(conta.loss_limit_ciclo) || 0
    const metaMensal  = parseFloat(conta.meta_mensal) || 0
    const stopDiario  = parseFloat(conta.stop_diario) || 0
    const stopMensal  = parseFloat(conta.stop_mensal) || 0
    const metaDiaria  = parseFloat(conta.meta_diaria) || 0
    const maxOps      = parseInt(conta.max_operacoes_dia) || 2

    // Semáforo de ciclo
    let semaforo = 'verde'
    let alertaCiclo = 'OK'
    let pctCicloConsumido = 0
    if (lossLimit > 0) {
      const lossAcum = Math.abs(Math.min(lucroCiclo, 0))
      pctCicloConsumido = (lossAcum / lossLimit) * 100
      if (pctCicloConsumido >= 100)  { semaforo = 'stop';     alertaCiclo = 'QUEBRADO' }
      else if (pctCicloConsumido >= 70) { semaforo = 'vermelho'; alertaCiclo = 'CRITICO'  }
      else if (pctCicloConsumido >= 40) { semaforo = 'amarelo';  alertaCiclo = 'ATENCAO'  }
    }

    // Status do dia
    let statusDia = 'LIVRE'
    if (stopDiario > 0 && lucroHoje <= -stopDiario) statusDia = 'STOP_DIA'
    else if (stopDiario > 0 && lucroHoje < 0 && Math.abs(lucroHoje) >= stopDiario * 0.7) statusDia = 'QUASE_STOP'
    else if (metaDiaria > 0 && lucroHoje >= metaDiaria) statusDia = 'META_DIA'
    else if (opsHoje >= maxOps) statusDia = 'MAX_OPS'

    // Status do mês/ciclo
    let statusMes = 'OK'
    if (stopMensal > 0 && lucroCiclo <= -stopMensal) statusMes = 'STOP_MES'
    else if (metaMensal > 0 && lucroCiclo >= metaMensal) statusMes = 'META_MES'
    else if (metaMensal > 0 && lucroCiclo >= metaMensal * 0.75) statusMes = 'QUASE_META'

    const faltaMeta = Math.max(0, metaMensal - lucroCiclo)
    const espacoRestante = lossLimit > 0 ? Math.max(0, lossLimit - Math.abs(Math.min(lucroCiclo, 0))) : null
    const progresso = metaMensal > 0 ? Math.min(100, (lucroCiclo / metaMensal) * 100) : 0

    const parts = periodoIni.split('-')
    const periodoLabel = parts[2] + '/' + parts[1]

    return {
      id:                   conta.id,
      nome:                 conta.nome,
      plataforma:           conta.plataforma,
      tipo:                 conta.tipo,
      contratos:            conta.contratos,
      meta_mensal:          metaMensal,
      stop_mensal:          stopMensal,
      meta_diaria:          metaDiaria,
      stop_diario:          stopDiario,
      max_ops_dia:          maxOps,
      loss_limit_ciclo:     lossLimit,
      custo_renovacao:      parseFloat(conta.custo_renovacao) || 0,
      lucro_ciclo:          lucroCiclo,
      lucro_hoje:           lucroHoje,
      ops_hoje:             opsHoje,
      pregoes:              parseInt(resumo.pregoes),
      gains:                parseInt(resumo.gains),
      losses:               parseInt(resumo.losses),
      semaforo,
      alerta_ciclo:         alertaCiclo,
      status_dia:           statusDia,
      status_mes:           statusMes,
      pct_ciclo_consumido:  pctCicloConsumido,
      espaco_restante:      espacoRestante,
      falta_meta:           faltaMeta,
      progresso,
      periodo_ini:          periodoIni,
      periodo_label:        periodoLabel,
    }
  }))

  return { statusCode: 200, body: JSON.stringify(result) }
})
