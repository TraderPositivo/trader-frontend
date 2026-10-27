import { db } from './_db.js'
import { verifyToken, wrap } from './_auth.js'

export const handler = wrap(async (event) => {
  const user = verifyToken(event)
  const sql  = db()
  const qs   = Object.fromEntries(new URLSearchParams(event.rawQuery || ''))

  // ── Ensure schema ───────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS checklist_items (
      id SERIAL PRIMARY KEY,
      conta_id INT NOT NULL REFERENCES contas(id) ON DELETE CASCADE,
      lado VARCHAR(10) NOT NULL,
      ordem INT DEFAULT 0,
      titulo VARCHAR(200) NOT NULL,
      descricao TEXT DEFAULT '',
      tag VARCHAR(50) DEFAULT '',
      ativo INT DEFAULT 1,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `
  // Add operar columns to contas if missing
  for (const col of [
    "ALTER TABLE contas ADD COLUMN IF NOT EXISTS operar_ativo SMALLINT DEFAULT 0",
    "ALTER TABLE contas ADD COLUMN IF NOT EXISTS contratos INT DEFAULT 1",
    "ALTER TABLE contas ADD COLUMN IF NOT EXISTS contratos_wdo INT DEFAULT 1",
    "ALTER TABLE contas ADD COLUMN IF NOT EXISTS contratos_modo_seguro INT DEFAULT 1",
    "ALTER TABLE contas ADD COLUMN IF NOT EXISTS stop_pts_win INT DEFAULT 200",
    "ALTER TABLE contas ADD COLUMN IF NOT EXISTS stop_pts_wdo INT DEFAULT 100",
    "ALTER TABLE contas ADD COLUMN IF NOT EXISTS max_operacoes_dia INT DEFAULT 5",
    "ALTER TABLE contas ADD COLUMN IF NOT EXISTS semaforo_ativo INT DEFAULT 1",
    "ALTER TABLE contas ADD COLUMN IF NOT EXISTS modo_conservador INT DEFAULT 0",
    "ALTER TABLE contas ADD COLUMN IF NOT EXISTS janela_tipo VARCHAR(20) DEFAULT 'manha'",
    "ALTER TABLE contas ADD COLUMN IF NOT EXISTS janela_inicio TIME DEFAULT '09:00'",
    "ALTER TABLE contas ADD COLUMN IF NOT EXISTS janela_fim TIME DEFAULT '11:30'",
  ]) {
    await sql.unsafe(col)
  }

  // ── GET ─────────────────────────────────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    const { action, conta_id, instrumento = 'WIN' } = qs
    const contaId = parseInt(conta_id)

    if (action === 'checklist') {
      const items = await sql`
        SELECT id, lado, ordem, titulo, descricao, tag, ativo
        FROM checklist_items WHERE conta_id=${contaId}
        ORDER BY lado, ordem
      `
      return { statusCode: 200, body: JSON.stringify(items) }
    }

    if (action === 'gestao') {
      const [conta] = await sql`SELECT * FROM contas WHERE id=${contaId} AND usuario_id=${user.id}`
      if (!conta) throw Object.assign(new Error('Conta não encontrada'), { status: 404 })

      const hoje = new Date().toISOString().slice(0, 10)

      // Ciclo ativo
      const ciclos = await sql`
        SELECT data_inicio FROM ciclos WHERE conta_id=${contaId} AND data_fim IS NULL
        ORDER BY data_inicio DESC LIMIT 1
      `
      const periodoIni = ciclos[0]
        ? new Date(ciclos[0].data_inicio).toISOString().slice(0, 10)
        : hoje.slice(0, 7) + '-01'

      // Resultado hoje
      const [hojeRow] = await sql`
        SELECT COALESCE(SUM(resultado), 0) AS res_dia, COUNT(*) AS ops_hoje
        FROM operacoes WHERE conta_id=${contaId} AND data_operacao=${hoje}
      `

      // Resultado ciclo
      const [cicloRow] = await sql`
        SELECT COALESCE(SUM(resultado), 0) AS lucro_ciclo
        FROM operacoes WHERE conta_id=${contaId} AND data_operacao >= ${periodoIni}
      `

      // Últimas ops para streak
      const recentOps = await sql`
        SELECT resultado FROM operacoes WHERE conta_id=${contaId}
        ORDER BY data_operacao DESC, horario_entrada DESC LIMIT 5
      `

      const resDia       = parseFloat(hojeRow.res_dia)
      const opsHoje      = parseInt(hojeRow.ops_hoje)
      const lucroCiclo   = parseFloat(cicloRow.lucro_ciclo)
      const stopDia      = parseFloat(conta.stop_diario)  || 0
      const metaDia      = parseFloat(conta.meta_diaria)  || 0
      const maxOps       = parseInt(conta.max_operacoes_dia) || 5
      const lossLimit    = parseFloat(conta.loss_limit_ciclo) || 0
      const semaforoAtivo = conta.semaforo_ativo != 0

      // Dentro da janela
      let dentroJanela = true
      if (semaforoAtivo) {
        const now = new Date()
        const hh  = now.getHours() * 60 + now.getMinutes()
        let jIni, jFim
        const tipo = conta.janela_tipo || 'manha'
        if (tipo === 'manha') { jIni = 9 * 60; jFim = 11 * 60 + 30 }
        else if (tipo === 'tarde') { jIni = 14 * 60; jFim = 17 * 60 }
        else {
          const [h1, m1] = String(conta.janela_inicio || '09:00').slice(0, 5).split(':').map(Number)
          const [h2, m2] = String(conta.janela_fim || '11:30').slice(0, 5).split(':').map(Number)
          jIni = h1 * 60 + m1; jFim = h2 * 60 + m2
        }
        dentroJanela = hh >= jIni && hh <= jFim
      }

      // Losses consecutivos
      const seq = recentOps.map(o => parseFloat(o.resultado) < 0 ? 'L' : 'G')
      let consLoss = 0
      for (const s of seq) { if (s === 'L') consLoss++; else break }

      // Semáforo
      const motivos = []
      let semaforo = semaforoAtivo ? 'VERDE' : 'LIVRE'

      if (semaforoAtivo) {
        if (metaDia > 0 && resDia >= metaDia) {
          semaforo = 'VERDE_META'
          motivos.push('🏆 Meta diária atingida!')
        }
        if (stopDia > 0 && resDia <= -stopDia) {
          semaforo = 'VERMELHO'
          motivos.push(`Stop diário atingido (−R$ ${Math.abs(stopDia).toFixed(2)})`)
        }
        if (opsHoje >= maxOps) {
          if (semaforo !== 'VERMELHO') semaforo = 'VERMELHO'
          motivos.push(`Máximo de operações atingido (${maxOps})`)
        }
        if (lossLimit > 0) {
          const pct = Math.abs(Math.min(lucroCiclo, 0)) / lossLimit * 100
          if (pct >= 100) { semaforo = 'VERMELHO'; motivos.push('Ciclo quebrado — loss limit atingido') }
          else if (pct >= 70) { if (semaforo === 'VERDE') semaforo = 'VERMELHO'; motivos.push('Ciclo crítico (' + pct.toFixed(0) + '% consumido)') }
          else if (pct >= 40) { if (semaforo === 'VERDE') semaforo = 'AMARELO'; motivos.push('Atenção: ciclo ' + pct.toFixed(0) + '% consumido') }
        }
        if (consLoss >= 3 && semaforo === 'VERDE') {
          semaforo = 'AMARELO'
          motivos.push(consLoss + ' losses consecutivos — opere com cautela')
        }
        if (!dentroJanela && semaforo === 'VERDE') motivos.push('Fora da janela de operação')
        if (motivos.length === 0) motivos.push('Tudo certo para operar')
      }

      // Modo atual
      const pctCiclo = lossLimit > 0
        ? Math.min(100, Math.abs(Math.min(lucroCiclo, 0)) / lossLimit * 100)
        : 0
      let modoAtual = 'normal'
      if (metaDia > 0 && resDia >= metaDia) modoAtual = 'meta'
      else if (stopDia > 0 && resDia <= -stopDia) modoAtual = 'parado'
      else if (pctCiclo >= 70) modoAtual = 'critico'
      else if (pctCiclo >= 40) modoAtual = 'seguro'

      // Calculadora
      const contratos    = parseInt(conta.contratos)   || 1
      const contratosWdo = parseInt(conta.contratos_wdo) || 1
      const stopPtsWin   = parseInt(conta.stop_pts_win)  || 200
      const stopPtsWdo   = parseInt(conta.stop_pts_wdo)  || 100
      const ctsSug    = modoAtual === 'seguro' || modoAtual === 'critico'
        ? Math.max(1, Math.floor(contratos / 2)) : contratos
      const ctsSugWdo = modoAtual === 'seguro' || modoAtual === 'critico'
        ? Math.max(1, Math.floor(contratosWdo / 2)) : contratosWdo

      const win_si = {
        cts_sug:    ctsSug,
        stop_pts:   stopPtsWin,
        stop_reais: parseFloat((ctsSug * 0.20 * stopPtsWin).toFixed(2)),
        alvo_pts:   stopPtsWin * 2,
        alvo_reais: parseFloat((ctsSug * 0.20 * stopPtsWin * 2).toFixed(2)),
        be_pts:     Math.round(stopPtsWin * 0.5),
      }
      const wdo_si = {
        cts_sug:    ctsSugWdo,
        stop_pts:   stopPtsWdo,
        stop_reais: parseFloat((ctsSugWdo * 10.0 * stopPtsWdo).toFixed(2)),
        alvo_pts:   stopPtsWdo * 2,
        alvo_reais: parseFloat((ctsSugWdo * 10.0 * stopPtsWdo * 2).toFixed(2)),
        be_pts:     Math.round(stopPtsWdo * 0.5),
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          semaforo, motivos,
          ops_hoje: opsHoje, max_ops: maxOps,
          res_dia: resDia, stop_disponivel: stopDia > 0 ? Math.max(0, stopDia + resDia) : null,
          stop_dia: stopDia, meta_dia: metaDia,
          ops_restantes: Math.max(0, maxOps - opsHoje),
          pct_ciclo: parseFloat(pctCiclo.toFixed(1)),
          lucro_ciclo: lucroCiclo, modo_atual: modoAtual,
          dentro_janela: dentroJanela, semaforo_ativo: semaforoAtivo,
          win_si, wdo_si,
        }),
      }
    }

    return { statusCode: 400, body: JSON.stringify({ erro: 'Ação inválida' }) }
  }

  // ── POST ────────────────────────────────────────────────────────────────────
  const body = JSON.parse(event.body || '{}')

  if (body.action === 'salvar_operar_config') {
    const contaId = parseInt(body.conta_id)
    const [conta] = await sql`SELECT id FROM contas WHERE id=${contaId} AND usuario_id=${user.id}`
    if (!conta) throw Object.assign(new Error('Acesso negado'), { status: 403 })

    await sql`
      UPDATE contas SET
        operar_ativo         = ${body.operar_ativo == 1 ? 1 : 0},
        semaforo_ativo       = ${body.semaforo_ativo == 1 ? 1 : 0},
        contratos            = ${parseInt(body.contratos) || 1},
        contratos_modo_seguro= ${parseInt(body.contratos_modo_seguro) || 1},
        contratos_wdo        = ${parseInt(body.contratos_wdo) || 1},
        max_operacoes_dia    = ${parseInt(body.max_operacoes_dia) || 5},
        stop_pts_win         = ${parseInt(body.stop_pts_win) || 0},
        stop_pts_wdo         = ${parseInt(body.stop_pts_wdo) || 0},
        modo_conservador     = ${body.modo_conservador == 1 ? 1 : 0},
        janela_tipo          = ${body.janela_tipo || 'manha'},
        janela_inicio        = ${body.janela_inicio || '09:00'},
        janela_fim           = ${body.janela_fim || '11:30'}
      WHERE id=${contaId}
    `
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  }

  if (body.action === 'salvar_checklist') {
    const contaId = parseInt(body.conta_id)
    const [conta] = await sql`SELECT id FROM contas WHERE id=${contaId} AND usuario_id=${user.id}`
    if (!conta) throw Object.assign(new Error('Acesso negado'), { status: 403 })

    const [maxOrd] = await sql`
      SELECT COALESCE(MAX(ordem), -1) AS m FROM checklist_items
      WHERE conta_id=${contaId} AND lado=${body.lado}
    `
    await sql`
      INSERT INTO checklist_items (conta_id, lado, ordem, titulo, descricao, tag, ativo)
      VALUES (${contaId}, ${body.lado}, ${maxOrd.m + 1},
              ${body.titulo}, ${body.descricao || ''}, ${body.tag || ''}, 1)
    `
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  }

  if (body.action === 'toggle_checklist') {
    await sql`UPDATE checklist_items SET ativo = CASE WHEN ativo=1 THEN 0 ELSE 1 END WHERE id=${parseInt(body.id)}`
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  }

  if (body.action === 'excluir_checklist') {
    await sql`DELETE FROM checklist_items WHERE id=${parseInt(body.id)}`
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  }

  if (body.action === 'resetar_checklist') {
    const contaId = parseInt(body.conta_id)
    const [conta] = await sql`SELECT id FROM contas WHERE id=${contaId} AND usuario_id=${user.id}`
    if (!conta) throw Object.assign(new Error('Acesso negado'), { status: 403 })

    await sql`DELETE FROM checklist_items WHERE conta_id=${contaId}`
    const defaults = [
      { lado: 'COMPRA', ordem: 0, titulo: 'VWAP a favor',    descricao: 'Preço acima da VWAP ou suporte rejeitado',     tag: 'VWAP'    },
      { lado: 'COMPRA', ordem: 1, titulo: 'Weis 5t exaustão',descricao: 'Onda de venda murchando no recuo',             tag: 'WEIS'    },
      { lado: 'COMPRA', ordem: 2, titulo: 'Seta ▲ confirma', descricao: 'Indicador plotou ▲ com volume',               tag: 'ENTRADA' },
      { lado: 'VENDA',  ordem: 0, titulo: 'VWAP a favor',    descricao: 'Preço abaixo da VWAP ou resistência rejeitada',tag: 'VWAP'    },
      { lado: 'VENDA',  ordem: 1, titulo: 'Weis 5t exaustão',descricao: 'Onda de compra murchando no repique',          tag: 'WEIS'    },
      { lado: 'VENDA',  ordem: 2, titulo: 'Seta ▼ confirma', descricao: 'Indicador plotou ▼ com volume',               tag: 'ENTRADA' },
    ]
    for (const d of defaults) {
      await sql`
        INSERT INTO checklist_items (conta_id, lado, ordem, titulo, descricao, tag, ativo)
        VALUES (${contaId}, ${d.lado}, ${d.ordem}, ${d.titulo}, ${d.descricao}, ${d.tag}, 1)
      `
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  }

  throw Object.assign(new Error('Ação não reconhecida'), { status: 400 })
})
