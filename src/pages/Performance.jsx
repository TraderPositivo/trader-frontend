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

// ─── Feriados B3 ─────────────────────────────────────────────────────────────
const B3_FERIADOS = new Set([
  // 2025
  '2025-01-01','2025-03-03','2025-03-04','2025-04-18','2025-04-21',
  '2025-05-01','2025-06-19','2025-09-07','2025-10-12','2025-11-02',
  '2025-11-15','2025-11-20','2025-12-25',
  // 2026
  '2026-01-01','2026-02-16','2026-02-17','2026-04-03','2026-04-21',
  '2026-05-01','2026-06-04','2026-07-09','2026-09-07','2026-10-12',
  '2026-11-02','2026-11-15','2026-11-20','2026-12-25',
])

function isPregao(iso) {
  const d = new Date(iso + 'T12:00:00')
  const dow = d.getDay()
  return dow !== 0 && dow !== 6 && !B3_FERIADOS.has(iso)
}

function contarPregoes(de, ate) {
  let count = 0
  const cur = new Date(de + 'T12:00:00')
  const fim = new Date(ate + 'T12:00:00')
  while (cur <= fim) {
    if (isPregao(cur.toISOString().slice(0, 10))) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

// ─── Range helpers ────────────────────────────────────────────────────────────
function toISO(d) { return d.toISOString().slice(0, 10) }

function rangeFromPreset(preset) {
  const hoje = new Date()
  if (preset === 'mes') {
    const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    return { de: toISO(ini), ate: toISO(fim) }
  }
  if (preset === '3m') {
    const ini = new Date(hoje); ini.setMonth(hoje.getMonth() - 2); ini.setDate(1)
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    return { de: toISO(ini), ate: toISO(fim) }
  }
  if (preset === '6m') {
    const ini = new Date(hoje); ini.setMonth(hoje.getMonth() - 5); ini.setDate(1)
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    return { de: toISO(ini), ate: toISO(fim) }
  }
  // '1m' = último mês completo
  const ini = new Date(hoje); ini.setMonth(hoje.getMonth() - 1); ini.setDate(1)
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
  return { de: toISO(ini), ate: toISO(fim) }
}

// ─── StatCard ──────────────────────────────────────────────────────────────
function StatCard({ label, value, color, sub, children }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
      {children || <div style={{ fontSize: '9px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{label}</div>}
      {!children && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '18px', fontWeight: 700, color: color || 'var(--txt)' }}>{value}</div>}
      {sub && <div style={{ fontSize: '10px', color: 'var(--txt3)', marginTop: '3px' }}>{sub}</div>}
    </div>
  )
}

// ─── LineChart ────────────────────────────────────────────────────────────────
function LineChart({ evolucao }) {
  const ref = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!ref.current || !evolucao?.length) return
    if (chartRef.current) chartRef.current.destroy()
    const labels = evolucao.map(e => fmtDia(e.data))
    const data   = evolucao.map(e => e.valor)
    const pos    = data[data.length - 1] >= 0
    const ctx    = ref.current.getContext('2d')
    const grad   = ctx.createLinearGradient(0, 0, 0, 200)
    grad.addColorStop(0, pos ? 'rgba(76,175,130,.25)' : 'rgba(224,92,106,.25)')
    grad.addColorStop(1, pos ? 'rgba(76,175,130,0)'   : 'rgba(224,92,106,0)')
    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: { labels, datasets: [{ data, borderColor: pos ? '#4caf82' : '#e05c6a', backgroundColor: grad, borderWidth: 2, pointRadius: data.length > 20 ? 0 : 3, fill: true, tension: 0.3 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => R(ctx.parsed.y) }, backgroundColor: '#17171d', borderColor: '#2c2c38', borderWidth: 1, titleColor: '#8888a0', bodyColor: '#e8e8f0' } },
        scales: {
          x: { grid: { color: '#1e2028' }, ticks: { color: '#50505f', font: { size: 10 }, maxTicksLimit: 10 } },
          y: { grid: { color: '#1e2028' }, ticks: { color: '#50505f', font: { size: 10 }, callback: v => R(v) } },
        },
      },
    })
    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [evolucao])

  if (!evolucao?.length) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--txt3)', fontSize:'12px' }}>Sem dados</div>
  return <canvas ref={ref} />
}

// ─── DoughnutChart ────────────────────────────────────────────────────────────
function DoughnutChart({ gains, losses }) {
  const ref = useRef(null); const chartRef = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    if (chartRef.current) chartRef.current.destroy()
    chartRef.current = new Chart(ref.current, {
      type: 'doughnut',
      data: { labels: ['Gain','Loss'], datasets: [{ data: [gains, losses], backgroundColor: ['rgba(76,175,130,.8)','rgba(224,92,106,.8)'], borderColor: ['#4caf82','#e05c6a'], borderWidth: 1, hoverOffset: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: '#8888a0', font: { size: 11 }, padding: 12 } }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} ops` }, backgroundColor: '#17171d', borderColor: '#2c2c38', borderWidth: 1, bodyColor: '#e8e8f0' } } },
    })
    return () => { if (chartRef.current) chartRef.current.destroy() }
  }, [gains, losses])
  return <canvas ref={ref} />
}

// ─── Análise ──────────────────────────────────────────────────────────────────
function gerarAnaliseLocal(d) {
  const wr = d.win_rate, lucro = d.lucro_total, totalOps = d.total_ops
  let nota = 5
  if (wr >= 60) nota += 2; else if (wr < 40) nota -= 1
  if (lucro > 0) nota += 1; else nota -= 1
  if (d.media_gain > Math.abs(d.media_loss)) nota += 1
  if (d.pior_seq >= 4) nota -= 1
  nota = Math.max(0, Math.min(10, Math.round(nota)))
  const fator = d.media_loss !== 0 ? Math.abs(d.media_gain / d.media_loss).toFixed(2) : '—'
  return {
    nota,
    resumo: `${totalOps} operações · ${wr.toFixed(0)}% acerto · ${lucro >= 0 ? 'Resultado positivo' : 'Resultado negativo'}.`,
    performance: [
      { icon: lucro >= 0 ? '✅' : '❌', texto: `Resultado líquido: <strong>${R(lucro)}</strong> · Bruto: <strong>${R(d.bruto_total)}</strong> · Custos: <strong>-${R(d.custo_total)}</strong>` },
      { icon: wr >= 50 ? '✅' : '⚠️', texto: `Taxa de acerto: <strong>${wr.toFixed(0)}%</strong> (${d.gains}G · ${d.losses}L de ${totalOps} ops)` },
      { icon: '📊', texto: `Média gain: <strong style="color:var(--green)">${R(d.media_gain)}</strong> · Média loss: <strong style="color:var(--red)">${R(d.media_loss)}</strong> · Fator: <strong>${fator}</strong>` },
      { icon: '🗓️', texto: `Melhor dia: <strong style="color:var(--green)">${R(d.melhor_dia)}</strong> · Pior dia: <strong style="color:var(--red)">${R(d.pior_dia)}</strong>` },
    ],
    risco: [
      { icon: d.seq_atual < 0 ? '⚠️' : '✅', texto: `Sequência atual: <strong>${d.seq_atual > 0 ? '+' : ''}${d.seq_atual} dias</strong>` },
      { icon: d.pior_seq >= 4 ? '🚨' : '✅', texto: `Maior sequência negativa: <strong>${d.pior_seq} dias</strong>${d.pior_seq >= 4 ? ' — opere com cautela após série assim' : ''}` },
      { icon: '🛡️', texto: `Maior série positiva: <strong>${d.melhor_seq} dias</strong> · R/R médio: <strong>${fator}:1</strong>` },
    ],
    padroes: [
      { icon: '🔍', texto: totalOps >= 10 ? `Com ${totalOps} ops, ${wr >= 55 ? 'acerto acima da média — setup funcionando' : wr >= 45 ? 'acerto na média — mantenha disciplina' : 'acerto abaixo da média — revise entradas'}.` : `Amostra pequena (${totalOps} ops).` },
      { icon: parseFloat(fator) >= 1.5 ? '✅' : '⚠️', texto: `Fator de lucro ${parseFloat(fator) >= 2 ? 'excelente' : parseFloat(fator) >= 1.5 ? 'bom' : 'abaixo do ideal'} (${fator}:1).` },
    ],
    recomendacoes: [
      ...(d.pior_seq >= 3 ? [{ icon: '💡', texto: `Após ${d.pior_seq} dias negativos consecutivos, considere reduzir posição temporariamente.` }] : []),
      ...(wr < 45 && totalOps >= 10 ? [{ icon: '💡', texto: 'Acerto abaixo de 45% — revise critérios de entrada.' }] : []),
      ...(d.custo_total > Math.abs(lucro) * 0.2 ? [{ icon: '💡', texto: `Custos (${R(d.custo_total)}) representam >20% do bruto — reduza número de operações.` }] : []),
      { icon: '💡', texto: 'Continue registrando todas as operações para melhorar a precisão da análise.' },
    ].slice(0, 3),
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Performance() {
  const hoje = toISO(new Date())
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [contaId,  setContaId]  = useState(null)
  const [preset,   setPreset]   = useState('mes')
  const [de,       setDe]       = useState(toISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
  const [ate,      setAte]      = useState(hoje)
  const [modoRes,  setModoRes]  = useState('liq')
  const [analise,  setAnalise]  = useState(null)
  const [aLoading, setALoading] = useState(false)

  const load = useCallback(async (cid, dateFrom, dateTo) => {
    setLoading(true)
    try {
      const qs = `performance?${cid ? 'conta_id=' + cid + '&' : ''}de=${dateFrom}&ate=${dateTo}`
      const r = await api.get(qs)
      setData(r)
      if (!contaId && r.conta_id && r.conta_id !== 'todas') setContaId(r.conta_id)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    const cid = contaId || (data?.contas?.[0]?.id ?? null)
    load(cid, de, ate)
  }, [contaId, de, ate])

  function applyPreset(p) {
    setPreset(p)
    if (p !== 'custom') {
      const r = rangeFromPreset(p)
      setDe(r.de); setAte(r.ate)
    }
  }

  async function deletarOp(id) {
    if (!confirm('Excluir operação?')) return
    await api.post('operacoes', { action: 'excluir', id })
    load(contaId, de, ate)
  }

  function gerarAnalise() {
    if (!data?.dados) return
    setALoading(true); setAnalise(null)
    setTimeout(() => { setAnalise(gerarAnaliseLocal(data.dados)); setALoading(false) }, 600)
  }

  const d = data?.dados

  function opVal(o) { return modoRes === 'bruto' ? (o.resultado + (o.custo || 0)) : o.resultado }
  const computedLucro  = d ? (modoRes === 'bruto' ? d.bruto_total : d.lucro_total) : 0
  const computedGains  = d?.ops ? d.ops.filter(o => opVal(o) > 0).length : (d?.gains || 0)
  const computedLosses = d?.ops ? d.ops.filter(o => opVal(o) < 0).length : (d?.losses || 0)
  const computedWR     = (computedGains + computedLosses) > 0 ? (computedGains / (computedGains + computedLosses) * 100).toFixed(0) : 0
  const pregoes        = de && ate ? contarPregoes(de, ate) : 0
  const diasOp         = d?.seq_dia?.length || 0
  const mediaOpsDay    = d && diasOp > 0 ? (d.total_ops / diasOp).toFixed(1) : '—'

  const instColor = (i) => i === 'WIN' ? '#5ba4f5' : i === 'WDO' ? 'var(--gold)' : 'var(--txt2)'

  return (
    <>
      <Nav />
      <main style={{ padding: '20px 24px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Seletor de conta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {data?.contas?.length > 1 && (
            <button onClick={() => setContaId('todas')} style={{
              padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
              background: contaId === 'todas' ? 'rgba(76,175,130,.15)' : 'var(--bg2)',
              border: `1px solid ${contaId === 'todas' ? 'rgba(76,175,130,.4)' : 'var(--border2)'}`,
              color: contaId === 'todas' ? 'var(--green)' : 'var(--txt2)',
            }}>Todas ({data.contas.length})</button>
          )}
          {data?.contas?.map(c => (
            <button key={c.id} onClick={() => setContaId(c.id)} style={{
              padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
              background: +contaId === +c.id ? 'var(--gold-bg)' : 'var(--bg2)',
              border: `1px solid ${+contaId === +c.id ? 'var(--gold-bd)' : 'var(--border2)'}`,
              color: +contaId === +c.id ? 'var(--gold)' : 'var(--txt2)',
            }}>{c.nome}</button>
          ))}
        </div>

        {/* Seletor de período */}
        <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'16px', flexWrap:'wrap', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'10px 14px' }}>
          <span style={{ fontSize:'9px', fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', color:'var(--txt3)', marginRight:'4px' }}>Período</span>
          {[
            { key:'mes',    label:'Este mês' },
            { key:'1m',     label:'Mês anterior' },
            { key:'3m',     label:'3 meses' },
            { key:'6m',     label:'6 meses' },
            { key:'custom', label:'Personalizado' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => applyPreset(key)} style={{
              padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: '.15s',
              background: preset === key ? 'var(--gold-bg)' : 'transparent',
              color: preset === key ? 'var(--gold)' : 'var(--txt3)',
              border: `1px solid ${preset === key ? 'var(--gold-bd)' : 'transparent'}`,
            }}>{label}</button>
          ))}
          {preset === 'custom' && (
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginLeft:'8px' }}>
              <input type="date" value={de} max={ate} onChange={e => setDe(e.target.value)} style={{ padding:'5px 8px', borderRadius:'6px', fontSize:'11px', background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--txt)', outline:'none' }} />
              <span style={{ fontSize:'11px', color:'var(--txt3)' }}>até</span>
              <input type="date" value={ate} min={de} max={hoje} onChange={e => setAte(e.target.value)} style={{ padding:'5px 8px', borderRadius:'6px', fontSize:'11px', background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--txt)', outline:'none' }} />
            </div>
          )}
          {de && ate && (
            <span style={{ marginLeft:'auto', fontSize:'10px', color:'var(--txt3)', fontFamily:"'JetBrains Mono',monospace" }}>
              {fmtDia(de)} → {fmtDia(ate)} · <span style={{ color:'var(--gold)' }}>{pregoes} pregões B3</span>
            </span>
          )}
        </div>

        {loading ? (
          <p style={{ textAlign:'center', padding:'48px', color:'var(--txt3)', fontSize:'13px' }}>Carregando…</p>
        ) : !d ? (
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'48px', textAlign:'center' }}>
            <div style={{ fontSize:'32px', marginBottom:'12px' }}>📊</div>
            <p style={{ color:'var(--txt2)', fontSize:'14px' }}>Nenhuma operação neste período.</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'9px', marginBottom:'14px' }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'14px 16px' }}>
                <div style={{ display:'flex', gap:'3px', marginBottom:'6px' }}>
                  {['liq','bruto'].map(m => (
                    <button key={m} onClick={() => setModoRes(m)} style={{ fontSize:'9px', fontWeight:700, padding:'2px 7px', borderRadius:'4px', border:`1px solid ${modoRes===m?'var(--gold)':'var(--border2)'}`, background:modoRes===m?'var(--gold-bg)':'transparent', color:modoRes===m?'var(--gold)':'var(--txt3)', cursor:'pointer' }}>{m==='liq'?'Líq':'Bruto'}</button>
                  ))}
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'16px', fontWeight:700, color:computedLucro>=0?'var(--green)':'var(--red)' }}>{R(computedLucro)}</div>
                <div style={{ fontSize:'9px', color:'var(--txt3)', marginTop:'3px' }}>Custos: -{R(d.custo_total)}</div>
              </div>

              <StatCard label="Acerto" value={`${computedWR}%`} color={computedWR>=60?'var(--green)':+computedWR>=40?'var(--yellow)':'var(--red)'} sub={`${computedGains}G · ${computedLosses}L`} />
              <StatCard label="Média Gain" value={R(d.media_gain)} color="var(--green)" />
              <StatCard label="Média Loss"  value={R(d.media_loss)} color="var(--red)" />
              <StatCard label="Melhor Dia"  value={R(d.melhor_dia)} color="var(--green)" />
              <StatCard label="Pior Dia"    value={R(d.pior_dia)}   color="var(--red)"  />
              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'14px 16px' }}>
                <div style={{ fontSize:'9px', color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px' }}>Pregões</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'16px', fontWeight:700, color:'var(--txt)' }}>{pregoes}</div>
                <div style={{ fontSize:'9px', color:'var(--txt3)', marginTop:'3px' }}>{diasOp} c/ ops · {mediaOpsDay} ops/dia</div>
              </div>
            </div>

            {/* Sequências + calendário de dias */}
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'16px 18px', marginBottom:'14px', display:'flex', gap:'20px', flexWrap:'wrap' }}>
              {[
                { lbl:'Seq. Atual',  val:`${d.seq_atual>0?'+':''}${d.seq_atual} dias`, color:d.seq_atual>0?'var(--green)':d.seq_atual<0?'var(--red)':'var(--txt)' },
                { lbl:'Melhor Seq +',val:`${d.melhor_seq} dias`, color:'var(--green)' },
                { lbl:'Pior Seq −',  val:`${d.pior_seq} dias`,  color:'var(--red)'   },
              ].map(({ lbl, val, color }) => (
                <div key={lbl} style={{ flex:1, minWidth:'80px' }}>
                  <div style={{ fontSize:'9px', color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'5px' }}>{lbl}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'20px', fontWeight:700, color }}>{val}</div>
                </div>
              ))}
              <div style={{ flex:4 }}>
                <div style={{ fontSize:'9px', color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'5px' }}>Dias operados (verde=gain · vermelho=loss)</div>
                <div style={{ display:'flex', gap:'3px', flexWrap:'wrap' }}>
                  {d.seq_dia?.map((item, i) => (
                    <div key={i} title={`${fmtDia(item.data)}: ${R(item.resultado)}`} style={{ width:'14px', height:'14px', borderRadius:'3px', background:item.tipo==='G'?'#4caf82':item.tipo==='L'?'#e05c6a':'var(--border2)', cursor:'default' }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'14px', marginBottom:'14px' }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
                <div style={{ padding:'13px 18px', borderBottom:'1px solid var(--border)', fontSize:'13px', fontWeight:700 }}>📈 Evolução do Saldo</div>
                <div style={{ padding:'18px', height:'220px' }}><LineChart evolucao={d.evolucao} /></div>
              </div>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
                <div style={{ padding:'13px 18px', borderBottom:'1px solid var(--border)', fontSize:'13px', fontWeight:700 }}>🎯 Distribuição</div>
                <div style={{ padding:'18px', height:'220px' }}><DoughnutChart gains={d.gains} losses={d.losses} /></div>
              </div>
            </div>

            {/* Análise */}
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', marginBottom:'14px' }}>
              <div style={{ padding:'13px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' }}>
                <span style={{ fontSize:'13px', fontWeight:700 }}>🤖 Análise do Período</span>
                <button onClick={gerarAnalise} disabled={aLoading} style={{
                  padding:'8px 18px', background:'linear-gradient(135deg,var(--gold),var(--gold2))', color:'#0c0c0e',
                  border:'none', borderRadius:'7px', fontFamily:'inherit', fontSize:'12px', fontWeight:700, cursor:'pointer', opacity:aLoading?.6:1,
                }}>
                  {aLoading ? '⏳ Analisando...' : '✦ Gerar Análise'}
                </button>
              </div>
              <div style={{ padding:'22px' }}>
                {aLoading && <div style={{ textAlign:'center', padding:'24px', color:'var(--txt3)', fontSize:'12px' }}>Analisando suas operações...</div>}
                {!analise && !aLoading && <div style={{ textAlign:'center', padding:'32px', color:'var(--txt3)', fontSize:'12px' }}><div style={{ fontSize:'32px', marginBottom:'10px' }}>🤖</div>Clique em <strong>Gerar Análise</strong> para um relatório detalhado.</div>}
                {analise && !aLoading && (
                  <div style={{ fontSize:'13px', lineHeight:1.9, color:'var(--txt2)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px', flexWrap:'wrap', gap:'10px' }}>
                      <div style={{ fontSize:'12px', color:'var(--txt2)' }}>{analise.resumo}</div>
                      <div style={{ textAlign:'center', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', padding:'8px 16px' }}>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'22px', fontWeight:700, color:analise.nota>=7?'var(--green)':analise.nota>=5?'var(--yellow)':'var(--red)' }}>{analise.nota}/10</div>
                        <div style={{ fontSize:'9px', color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'.5px', marginTop:'2px' }}>{analise.nota>=7?'Boa gestão':analise.nota>=5?'Regular':'A melhorar'}</div>
                      </div>
                    </div>
                    {[{ key:'performance',title:'📊 Performance'},{ key:'risco',title:'🛡️ Risco'},{ key:'padroes',title:'🔍 Padrões'},{ key:'recomendacoes',title:'💡 Recomendações'}].map(({ key, title }) => {
                      const items = analise[key] || []; if (!items.length) return null
                      return (
                        <div key={key} style={{ marginBottom:'18px' }}>
                          <div style={{ color:'var(--txt)', fontSize:'12px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:'8px', paddingBottom:'6px', borderBottom:'1px solid var(--border)' }}>{title}</div>
                          {items.map((item, i) => (
                            <div key={i} style={{ display:'flex', gap:'10px', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:'12px' }}>
                              <span style={{ flexShrink:0, fontSize:'14px' }}>{item.icon}</span>
                              <span style={{ color:'var(--txt2)', lineHeight:1.6, flex:1 }} dangerouslySetInnerHTML={{ __html: item.texto }} />
                            </div>
                          ))}
                        </div>
                      )
                    })}
                    <div style={{ fontSize:'10px', color:'var(--txt3)', marginTop:'12px', paddingTop:'10px', borderTop:'1px solid var(--border)', textAlign:'right' }}>
                      {fmtDia(de)} → {fmtDia(ate)} · {d.total_ops} ops · {pregoes} pregões B3
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabela de operações */}
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', marginBottom:'14px' }}>
              <div style={{ padding:'13px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'13px', fontWeight:700 }}>Operações do Período</span>
                <span style={{ fontSize:'11px', color:'var(--txt3)' }}>{d.total_ops} operações</span>
              </div>
              <div style={{ maxHeight:'300px', overflowY:'auto', overscrollBehavior:'contain' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                  <thead>
                    <tr>{['Data','Hora','Tipo','Inst.','Cts','Pts','Bruto','Custo','Líq',contaId==='todas'?'Conta':'Obs',''].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'9px 10px', fontSize:'9px', letterSpacing:'1px', color:'var(--txt3)', textTransform:'uppercase', borderBottom:'1px solid var(--border)', position:'sticky', top:0, background:'var(--bg2)', whiteSpace:'nowrap' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {d.ops.map(o => {
                      const bruto = o.resultado + (o.custo || 0)
                      const inst  = o.instrumento || 'WIN'
                      return (
                        <tr key={o.id}
                          onMouseEnter={e => e.currentTarget.querySelectorAll('td').forEach(td => td.style.background='rgba(255,255,255,.02)')}
                          onMouseLeave={e => e.currentTarget.querySelectorAll('td').forEach(td => td.style.background='')}>
                          <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--border)', fontFamily:"'JetBrains Mono',monospace", color:'var(--txt2)', fontSize:'11px', whiteSpace:'nowrap' }}>{fmtDia(o.data_operacao)}</td>
                          <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--border)', fontFamily:"'JetBrains Mono',monospace", color:'var(--txt3)', fontSize:'11px' }}>{(o.horario_entrada||'').slice(0,5)}</td>
                          <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--border)' }}>
                            <span style={{ display:'inline-block', padding:'2px 7px', borderRadius:'20px', fontSize:'9px', fontWeight:700, background:o.tipo==='COMPRA'?'rgba(77,159,255,.15)':'rgba(212,168,67,.15)', color:o.tipo==='COMPRA'?'#4d9fff':'var(--yellow)' }}>{o.tipo}</span>
                          </td>
                          <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--border)', fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', fontWeight:700, color:instColor(inst) }}>{inst}</td>
                          <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--border)', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'var(--txt2)', textAlign:'center' }}>{o.contratos||1}</td>
                          <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--border)', fontFamily:"'JetBrains Mono',monospace", color:o.pontos>0?'var(--green)':'var(--red)', fontSize:'11px' }}>{o.pontos>0?'+':''}{o.pontos}</td>
                          <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--border)', fontFamily:"'JetBrains Mono',monospace", color:bruto>=0?'var(--green)':'var(--red)', fontSize:'11px' }}>{R(bruto)}</td>
                          <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--border)', fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'var(--red)' }}>{o.custo>0?`-${R(o.custo)}`:'—'}</td>
                          <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--border)', fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:o.resultado>=0?'var(--green)':'var(--red)', fontSize:'11px' }}>{R(o.resultado)}</td>
                          <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--border)', fontSize:'10px', color:'var(--txt3)', maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {contaId === 'todas' ? (o.conta_nome || '—') : (o.observacao || '—')}
                          </td>
                          <td style={{ padding:'8px 10px', borderBottom:'1px solid var(--border)' }}>
                            <button onClick={() => deletarOp(o.id)}
                              onMouseEnter={e => e.target.style.color='var(--red)'}
                              onMouseLeave={e => e.target.style.color='var(--txt3)'}
                              style={{ background:'none', border:'none', color:'var(--txt3)', cursor:'pointer', fontSize:'12px', padding:'2px 5px' }}>✕</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
      <style>{`@keyframes ldot{0%,80%,100%{transform:scale(0);opacity:.3}40%{transform:scale(1);opacity:1}}`}</style>
    </>
  )
}
