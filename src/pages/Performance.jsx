import { useState, useEffect, useRef, useCallback } from 'react'
import { Chart, LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Filler, DoughnutController, ArcElement, Legend } from 'chart.js'
import Nav from '../components/Nav'
import { api } from '../lib/api'

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Filler, DoughnutController, ArcElement, Legend)

function R(v) {
  const abs = Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (v < 0 ? '-' : '') + 'R$ ' + abs
}
function fmtDia(iso) { return iso ? iso.slice(5).split('-').reverse().join('/') : '' }

// ─── Stats card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, color, sub, children }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
      {children || <div style={{ fontSize: '9px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{label}</div>}
      {!children && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '18px', fontWeight: 700, color: color || 'var(--txt)' }}>{value}</div>}
      {sub && <div style={{ fontSize: '10px', color: 'var(--txt3)', marginTop: '3px' }}>{sub}</div>}
    </div>
  )
}

// ─── Gráfico de linha ────────────────────────────────────────────────────────
function LineChart({ evolucao }) {
  const ref = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!ref.current || !evolucao?.length) return
    if (chartRef.current) { chartRef.current.destroy() }

    const labels = evolucao.map(e => fmtDia(e.data))
    const data   = evolucao.map(e => e.valor)
    const pos    = data[data.length - 1] >= 0

    const ctx = ref.current.getContext('2d')
    const grad = ctx.createLinearGradient(0, 0, 0, 200)
    grad.addColorStop(0, pos ? 'rgba(76,175,130,.25)' : 'rgba(224,92,106,.25)')
    grad.addColorStop(1, pos ? 'rgba(76,175,130,0)' : 'rgba(224,92,106,0)')

    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: pos ? '#4caf82' : '#e05c6a',
          backgroundColor: grad,
          borderWidth: 2,
          pointRadius: data.length > 20 ? 0 : 3,
          pointBackgroundColor: data.map((v, i) => v >= (data[i - 1] ?? 0) ? '#4caf82' : '#e05c6a'),
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: {
          callbacks: { label: ctx => R(ctx.parsed.y) },
          backgroundColor: '#17171d', borderColor: '#2c2c38', borderWidth: 1,
          titleColor: '#8888a0', bodyColor: '#e8e8f0',
        }},
        scales: {
          x: { grid: { color: '#1e2028' }, ticks: { color: '#50505f', font: { size: 10 }, maxTicksLimit: 10 } },
          y: { grid: { color: '#1e2028' }, ticks: { color: '#50505f', font: { size: 10 }, callback: v => R(v) } },
        },
      },
    })
    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [evolucao])

  if (!evolucao?.length) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--txt3)', fontSize: '12px' }}>Sem dados</div>
  return <canvas ref={ref} />
}

// ─── Gráfico de rosca ─────────────────────────────────────────────────────────
function DoughnutChart({ gains, losses }) {
  const ref = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    if (chartRef.current) chartRef.current.destroy()
    chartRef.current = new Chart(ref.current, {
      type: 'doughnut',
      data: {
        labels: ['Gain', 'Loss'],
        datasets: [{ data: [gains, losses], backgroundColor: ['rgba(76,175,130,.8)', 'rgba(224,92,106,.8)'], borderColor: ['#4caf82', '#e05c6a'], borderWidth: 1, hoverOffset: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#8888a0', font: { size: 11 }, padding: 12 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} ops` }, backgroundColor: '#17171d', borderColor: '#2c2c38', borderWidth: 1, bodyColor: '#e8e8f0' },
        },
      },
    })
    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [gains, losses])

  return <canvas ref={ref} />
}

// ─── Análise client-side ──────────────────────────────────────────────────────
function gerarAnaliseLocal(d, periodo, mes) {
  const wr = d.win_rate
  const lucro = d.lucro_total
  const totalOps = d.total_ops
  const seqAtual = d.seq_atual
  const melhorSeq = d.melhor_seq
  const piorSeq = d.pior_seq

  // Nota de 0 a 10
  let nota = 5
  if (wr >= 60) nota += 2; else if (wr < 40) nota -= 1
  if (lucro > 0) nota += 1; else nota -= 1
  if (d.media_gain > Math.abs(d.media_loss)) nota += 1
  if (piorSeq >= 4) nota -= 1
  nota = Math.max(0, Math.min(10, Math.round(nota)))

  const fator = d.media_loss !== 0 ? Math.abs(d.media_gain / d.media_loss).toFixed(2) : '—'

  return {
    nota,
    resumo: `${totalOps} operações analisadas · ${wr.toFixed(0)}% acerto · ${lucro >= 0 ? 'Resultado positivo' : 'Resultado negativo'} no período.`,
    performance: [
      { icon: lucro >= 0 ? '✅' : '❌', texto: `Resultado líquido: <strong>${R(lucro)}</strong> · Bruto: <strong>${R(d.bruto_total)}</strong> · Custos: <strong>-${R(d.custo_total)}</strong>` },
      { icon: wr >= 50 ? '✅' : '⚠️', texto: `Taxa de acerto de <strong>${wr.toFixed(0)}%</strong> (${d.gains} ganhos e ${d.losses} perdas de ${totalOps} operações)` },
      { icon: '📊', texto: `Média gain: <strong style="color:var(--green)">${R(d.media_gain)}</strong> · Média loss: <strong style="color:var(--red)">${R(d.media_loss)}</strong> · Fator de lucro: <strong>${fator}</strong>` },
      { icon: '🗓️', texto: `Melhor dia: <strong style="color:var(--green)">${R(d.melhor_dia)}</strong> · Pior dia: <strong style="color:var(--red)">${R(d.pior_dia)}</strong>` },
    ],
    risco: [
      { icon: seqAtual < 0 ? '⚠️' : '✅', texto: `Sequência atual: <strong>${seqAtual > 0 ? '+' : ''}${seqAtual} dias</strong> ${seqAtual > 0 ? '(série positiva)' : seqAtual < 0 ? '(série negativa — opere com cautela)' : '(neutro)'}` },
      { icon: piorSeq >= 4 ? '🚨' : piorSeq >= 3 ? '⚠️' : '✅', texto: `Maior série negativa: <strong>${piorSeq} dias consecutivos</strong> ${piorSeq >= 4 ? '— verifique o setup utilizado nestes dias' : ''}` },
      { icon: '🛡️', texto: `Maior série positiva: <strong>${melhorSeq} dias</strong> · Relação gain/loss: <strong>${d.media_gain && d.media_loss ? Math.abs(d.media_gain / d.media_loss).toFixed(2) + ':1' : '—'}</strong>` },
    ],
    padroes: [
      { icon: '🔍', texto: totalOps >= 10
        ? `Com ${totalOps} operações, ${wr >= 55 ? 'o acerto está acima da média — o setup está funcionando' : wr >= 45 ? 'o acerto está na média — mantenha a disciplina' : 'o acerto abaixo da média pode indicar setup inadequado ou entradas prematuras'}.`
        : `Amostra pequena (${totalOps} ops) — aguarde mais operações para conclusões mais sólidas.` },
      { icon: fator !== '—' && parseFloat(fator) >= 1.5 ? '✅' : '⚠️', texto: fator !== '—' ? `Fator de lucro ${parseFloat(fator) >= 2 ? 'excelente' : parseFloat(fator) >= 1.5 ? 'bom' : parseFloat(fator) >= 1 ? 'no limite — melhore o alvo ou reduza o stop' : 'negativo — revise a relação risco/retorno'} (${fator}:1).` : 'Sem dados suficientes para calcular o fator de lucro.' },
    ],
    recomendacoes: [
      ...(piorSeq >= 3 ? [{ icon: '💡', texto: `Após ${piorSeq} dias negativos consecutivos, considere reduzir o tamanho da posição temporariamente (modo conservador).` }] : []),
      ...(wr < 45 && totalOps >= 10 ? [{ icon: '💡', texto: 'Taxa de acerto abaixo de 45% — revise seus critérios de entrada no checklist ou reduza o nível de exigência.' }] : []),
      ...(d.custo_total > Math.abs(lucro) * 0.2 ? [{ icon: '💡', texto: `Custos (${R(d.custo_total)}) representam mais de 20% do resultado bruto — reduza o número de operações ou negocie taxas.` }] : []),
      { icon: '💡', texto: `Continue registrando todas as operações para melhorar a precisão da análise ao longo do tempo.` },
    ].slice(0, 3),
  }
}

// ─── Performance principal ────────────────────────────────────────────────────
export default function Performance() {
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [contaId,   setContaId]   = useState(null)
  const [mes,       setMes]       = useState(new Date().toISOString().slice(0, 7))
  const [modoRes,   setModoRes]   = useState('liq')
  const [aPeriodo,  setAPeriodo]  = useState('semanal')
  const [analise,   setAnalise]   = useState(null)
  const [aLoading,  setALoading]  = useState(false)

  const load = useCallback(async (cid, m) => {
    setLoading(true)
    try {
      const qs = `performance?${cid ? 'conta_id=' + cid + '&' : ''}mes=${m}`
      const r = await api.get(qs)
      setData(r)
      if (!contaId && r.conta_id) setContaId(r.conta_id)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(contaId, mes) }, [contaId, mes])

  async function deletarOp(id) {
    if (!confirm('Excluir operação?')) return
    await api.post('operacoes', { action: 'excluir', id })
    load(contaId, mes)
  }

  function gerarAnalise() {
    if (!data?.dados) return
    setALoading(true)
    setAnalise(null)
    setTimeout(() => {
      setAnalise(gerarAnaliseLocal(data.dados, aPeriodo, mes))
      setALoading(false)
    }, 800)
  }

  const d = data?.dados

  // Para calcular com modo bruto/líq
  function opVal(o) {
    return modoRes === 'bruto' ? (o.resultado + (o.custo || 0)) : o.resultado
  }

  const computedLucro = d ? (modoRes === 'bruto' ? d.bruto_total : d.lucro_total) : 0
  const computedGains  = d?.ops ? d.ops.filter(o => opVal(o) > 0).length : (d?.gains || 0)
  const computedLosses = d?.ops ? d.ops.filter(o => opVal(o) < 0).length : (d?.losses || 0)
  const computedWR     = (computedGains + computedLosses) > 0
    ? (computedGains / (computedGains + computedLosses) * 100).toFixed(0) : 0

  return (
    <>
      <Nav />
      <main style={{ padding: '20px 24px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Seletor conta + mês */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
          {data?.contas?.map(c => (
            <button key={c.id} onClick={() => setContaId(c.id)} style={{
              padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
              background: +contaId === +c.id ? 'var(--gold-bg)' : 'var(--bg2)',
              border: `1px solid ${+contaId === +c.id ? 'var(--gold-bd)' : 'var(--border2)'}`,
              color: +contaId === +c.id ? 'var(--gold)' : 'var(--txt2)',
            }}>{c.nome}</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Mês</span>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)} style={{
              padding: '6px 10px', borderRadius: '7px', fontSize: '12px',
              background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--txt)', outline: 'none',
            }} />
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '48px', color: 'var(--txt3)', fontSize: '13px' }}>Carregando…</p>
        ) : !d ? (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
            <p style={{ color: 'var(--txt2)', fontSize: '14px' }}>Nenhuma operação registrada neste período.</p>
          </div>
        ) : (
          <>
            {/* Stats grid — 6 cards como PHP */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '10px', marginBottom: '16px' }}>
              {/* Lucro card com toggle */}
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: '3px', marginBottom: '6px' }}>
                  {['liq', 'bruto'].map(m => (
                    <button key={m} onClick={() => setModoRes(m)} style={{
                      fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px',
                      border: `1px solid ${modoRes === m ? 'var(--gold)' : 'var(--border2)'}`,
                      background: modoRes === m ? 'var(--gold-bg)' : 'transparent',
                      color: modoRes === m ? 'var(--gold)' : 'var(--txt3)',
                      cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace",
                    }}>{m === 'liq' ? 'Líq' : 'Bruto'}</button>
                  ))}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '18px', fontWeight: 700, color: computedLucro >= 0 ? 'var(--green)' : 'var(--red)' }}>{R(computedLucro)}</div>
                <div style={{ fontSize: '10px', color: 'var(--txt3)', marginTop: '3px' }}>
                  {modoRes === 'liq' ? `Bruto: ${R(d.bruto_total)} · Custos: -${R(d.custo_total)}` : `Líq: ${R(d.lucro_total)} · Custos: -${R(d.custo_total)}`}
                </div>
              </div>

              <StatCard label="Taxa de Acerto" value={`${computedWR}%`} color={computedWR >= 60 ? 'var(--green)' : +computedWR >= 40 ? 'var(--yellow)' : 'var(--red)'} sub={`${computedGains}G · ${computedLosses}L · ${d.total_ops} total`} />
              <StatCard label="Média Gain" value={R(d.media_gain)} color="var(--green)" />
              <StatCard label="Média Loss" value={R(d.media_loss)} color="var(--red)" />
              <StatCard label="Maior Gain" value={R(d.max_gain)} color="var(--green)" />
              <StatCard label="Maior Loss" value={R(d.max_loss)} color="var(--red)" />
            </div>

            {/* Sequência — exatamente como PHP */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 18px', marginBottom: '16px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {[
                { lbl: 'Sequência Atual',   val: `${d.seq_atual > 0 ? '+' : ''}${d.seq_atual} dias`, color: d.seq_atual > 0 ? 'var(--green)' : d.seq_atual < 0 ? 'var(--red)' : 'var(--txt)' },
                { lbl: 'Melhor Sequência +', val: `${d.melhor_seq} dias`, color: 'var(--green)' },
                { lbl: 'Pior Sequência −',   val: `${d.pior_seq} dias`,   color: 'var(--red)' },
              ].map(({ lbl, val, color }) => (
                <div key={lbl} style={{ flex: 1, minWidth: '100px' }}>
                  <div style={{ fontSize: '9px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '5px' }}>{lbl}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '20px', fontWeight: 700, color }}>{val}</div>
                </div>
              ))}
              <div style={{ flex: 3 }}>
                <div style={{ fontSize: '9px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Dias do Mês (verde = gain · vermelho = loss)</div>
                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                  {d.seq_dia?.map((item, i) => (
                    <div key={i} title={`${fmtDia(item.data)}: ${R(item.resultado)}`} style={{
                      width: '14px', height: '14px', borderRadius: '3px',
                      background: item.tipo === 'G' ? '#4caf82' : item.tipo === 'L' ? '#e05c6a' : 'var(--border2)',
                      cursor: 'default',
                    }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Gráficos lado a lado */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 700 }}>📈 Evolução do Saldo</div>
                <div style={{ padding: '18px', height: '240px' }}><LineChart evolucao={d.evolucao} /></div>
              </div>
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 700 }}>🎯 Distribuição</div>
                <div style={{ padding: '18px', height: '240px' }}><DoughnutChart gains={d.gains} losses={d.losses} /></div>
              </div>
            </div>

            {/* Tabela de operações */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Operações do Mês</span>
                <span style={{ fontSize: '11px', color: 'var(--txt3)' }}>{d.total_ops} operações</span>
              </div>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr>{['Data', 'Hora', 'Tipo', 'Pts', 'Bruto', 'Custo', 'Líq', 'Obs', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '9px 12px', fontSize: '9px', letterSpacing: '1px', color: 'var(--txt3)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg2)' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {d.ops.map(o => {
                      const bruto = o.resultado + (o.custo || 0)
                      return (
                        <tr key={o.id}
                          onMouseEnter={e => e.currentTarget.querySelectorAll('td').forEach(td => td.style.background = 'rgba(255,255,255,.02)')}
                          onMouseLeave={e => e.currentTarget.querySelectorAll('td').forEach(td => td.style.background = '')}>
                          <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: "'JetBrains Mono',monospace", color: 'var(--txt2)', fontSize: '11px' }}>{fmtDia(o.data_operacao)}</td>
                          <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: "'JetBrains Mono',monospace", color: 'var(--txt3)', fontSize: '11px' }}>{(o.horario_entrada || '').slice(0,5)}</td>
                          <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '9px', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", background: o.tipo === 'COMPRA' ? 'rgba(77,159,255,.15)' : 'rgba(212,168,67,.15)', color: o.tipo === 'COMPRA' ? '#4d9fff' : 'var(--yellow)' }}>{o.tipo}</span>
                          </td>
                          <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: "'JetBrains Mono',monospace", color: o.pontos > 0 ? 'var(--green)' : 'var(--red)' }}>
                            {o.pontos > 0 ? '+' : ''}{o.pontos}
                          </td>
                          <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: "'JetBrains Mono',monospace", color: bruto >= 0 ? 'var(--green)' : 'var(--red)' }}>{R(bruto)}</td>
                          <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: "'JetBrains Mono',monospace", fontSize: '9px', color: 'var(--red)' }}>{o.custo > 0 ? `-${R(o.custo)}` : '—'}</td>
                          <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: o.resultado >= 0 ? 'var(--green)' : 'var(--red)' }}>{R(o.resultado)}</td>
                          <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: '10px', color: 'var(--txt3)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.observacao || '—'}</td>
                          <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)' }}>
                            <button onClick={() => deletarOp(o.id)}
                              onMouseEnter={e => e.target.style.color = 'var(--red)'}
                              onMouseLeave={e => e.target.style.color = 'var(--txt3)'}
                              style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: '12px', padding: '2px 5px', borderRadius: '3px' }}>✕</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Análise Inteligente */}
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>🤖 Análise Inteligente</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['semanal', 'mensal', 'periodo'].map(p => (
                    <button key={p} onClick={() => { setAPeriodo(p); setAnalise(null) }} style={{
                      padding: '5px 14px', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: '.2s',
                      background: aPeriodo === p ? 'var(--gold-bg)' : 'transparent',
                      color: aPeriodo === p ? 'var(--gold)' : 'var(--txt3)',
                      border: `1px solid ${aPeriodo === p ? 'var(--gold-bd)' : 'transparent'}`,
                    }}>{{ semanal: 'Semanal', mensal: 'Mensal', periodo: 'Período' }[p]}</button>
                  ))}
                </div>
                <button onClick={gerarAnalise} disabled={aLoading} style={{
                  padding: '8px 18px', background: 'linear-gradient(135deg,var(--gold),var(--gold2))', color: '#0c0c0e',
                  border: 'none', borderRadius: '7px', fontFamily: 'inherit', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  opacity: aLoading ? .6 : 1,
                }}>
                  {aLoading ? '⏳ Analisando...' : '✦ Gerar Análise'}
                </button>
              </div>

              <div style={{ padding: '22px' }}>
                {aLoading && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)', animation: `ldot .8s infinite ${i * 0.15}s` }} />
                      ))}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--txt3)' }}>Analisando suas operações...</div>
                  </div>
                )}

                {!analise && !aLoading && (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--txt3)', fontSize: '12px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>🤖</div>
                    Selecione o período e clique em <strong>Gerar Análise</strong><br />para receber um relatório detalhado das suas operações.
                  </div>
                )}

                {analise && !aLoading && (
                  <div style={{ fontSize: '13px', lineHeight: 1.9, color: 'var(--txt2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--txt2)' }}>{analise.resumo}</div>
                      <div style={{ textAlign: 'center', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px' }}>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '22px', fontWeight: 700, color: analise.nota >= 7 ? 'var(--green)' : analise.nota >= 5 ? 'var(--yellow)' : 'var(--red)' }}>{analise.nota}/10</div>
                        <div style={{ fontSize: '9px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px', marginTop: '2px' }}>{analise.nota >= 7 ? 'Boa gestão' : analise.nota >= 5 ? 'Gestão regular' : 'A melhorar'}</div>
                      </div>
                    </div>

                    {[
                      { key: 'performance',   title: '📊 Performance' },
                      { key: 'risco',         title: '🛡️ Gestão de Risco' },
                      { key: 'padroes',       title: '🔍 Padrões Identificados' },
                      { key: 'recomendacoes', title: '💡 Recomendações' },
                    ].map(({ key, title }) => {
                      const items = analise[key] || []
                      if (!items.length) return null
                      return (
                        <div key={key} style={{ marginBottom: '20px' }}>
                          <div style={{ color: 'var(--txt)', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>{title}</div>
                          {items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: '10px', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '12px' }}>
                              <span style={{ flexShrink: 0, fontSize: '14px', marginTop: '1px' }}>{item.icon}</span>
                              <span style={{ color: 'var(--txt2)', lineHeight: 1.6, flex: 1 }} dangerouslySetInnerHTML={{ __html: item.texto }} />
                            </div>
                          ))}
                        </div>
                      )
                    })}

                    <div style={{ fontSize: '10px', color: 'var(--txt3)', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                      Gerado em {new Date().toLocaleString('pt-BR')} · {d.total_ops} operações analisadas · Período: {aPeriodo} · {mes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <style>{`
        @keyframes ldot { 0%,80%,100%{transform:scale(0);opacity:.3} 40%{transform:scale(1);opacity:1} }
        @media(max-width:900px){ .perf-stats{grid-template-columns:repeat(3,1fr)!important;} }
        @media(max-width:600px){ .perf-stats{grid-template-columns:repeat(2,1fr)!important;} }
      `}</style>
    </>
  )
}
