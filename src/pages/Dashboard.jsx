import { useState, useEffect, useCallback } from 'react'
import Nav from '../components/Nav'
import { api } from '../lib/api'

// ─── Utils ────────────────────────────────────────────────────────────────────
function R(v) {
  const abs = Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (v < 0 ? '-' : '') + 'R$ ' + abs
}

function hojeISO() { return new Date().toISOString().slice(0, 10) }
function horaAtual() { return new Date().toTimeString().slice(0, 5) }

const B3_FERIADOS = new Set([
  '2025-01-01','2025-03-03','2025-03-04','2025-04-18','2025-04-21',
  '2025-05-01','2025-06-19','2025-09-07','2025-10-12','2025-11-02',
  '2025-11-15','2025-11-20','2025-12-25',
  '2026-01-01','2026-02-16','2026-02-17','2026-04-03','2026-04-21',
  '2026-05-01','2026-06-04','2026-07-09','2026-09-07','2026-10-12',
  '2026-11-02','2026-11-15','2026-11-20','2026-12-25',
])

function calcCalendario() {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth()
  const today = hojeISO()
  const dias  = new Date(year, month + 1, 0).getDate()
  const all = [], past = [], remaining = []
  for (let d = 1; d <= dias; d++) {
    const dow = new Date(year, month, d).getDay()
    if (dow === 0 || dow === 6) continue
    const iso = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    if (B3_FERIADOS.has(iso)) continue
    all.push(iso)
    if (iso < today) past.push(iso)
    else remaining.push(iso)
  }
  return {
    total: all.length, passados: past.length,
    restantes: remaining.length, isHoje: all.includes(today),
    mes: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
  }
}

// ─── Semáforo / badges ───────────────────────────────────────────────────────
const SM = {
  verde:    '#4caf82',
  amarelo:  '#d4a843',
  vermelho: '#e05c6a',
  stop:     '#e05c6a',
}
const STATUS_DIA = {
  LIVRE:      { label: 'Livre',     cor: '#8888a0', bg: 'rgba(136,136,160,.1)', bd: 'rgba(136,136,160,.2)'  },
  META_DIA:   { label: 'Meta ✓',   cor: '#4caf82', bg: 'rgba(76,175,130,.1)',  bd: 'rgba(76,175,130,.25)' },
  STOP_DIA:   { label: 'Stop Dia', cor: '#e05c6a', bg: 'rgba(224,92,106,.1)',  bd: 'rgba(224,92,106,.25)' },
  QUASE_STOP: { label: '⚠ Stop',   cor: '#d4a843', bg: 'rgba(212,168,67,.1)', bd: 'rgba(212,168,67,.25)'  },
  MAX_OPS:    { label: 'Max Ops',  cor: '#d4a843', bg: 'rgba(212,168,67,.1)', bd: 'rgba(212,168,67,.2)'   },
}
function Badge({ status }) {
  const c = STATUS_DIA[status] || STATUS_DIA.LIVRE
  return <span style={{ fontSize:'10px', fontWeight:700, padding:'3px 9px', borderRadius:'4px', background:c.bg, border:`1px solid ${c.bd}`, color:c.cor, fontFamily:"'JetBrains Mono',monospace", whiteSpace:'nowrap' }}>{c.label}</span>
}

// ─── ContaCard ───────────────────────────────────────────────────────────────
function ContaCard({ c, selected, onClick }) {
  const stripeColor = c.status_mes === 'STOP_MES' ? 'var(--red)'
    : c.status_mes === 'META_MES' ? 'var(--green)'
    : SM[c.semaforo] || SM.verde

  const metaPct = Math.max(0, Math.min(100, c.progresso || 0))
  const stopPct = c.loss_limit_ciclo > 0 ? Math.min(100, c.pct_ciclo_consumido || 0) : 0
  const diasSobrev = c.espaco_restante > 0 && c.stop_diario > 0
    ? Math.floor(c.espaco_restante / c.stop_diario) : null

  return (
    <div onClick={onClick} style={{
      background: selected ? 'var(--bg3)' : 'var(--bg2)',
      border: `1px solid ${selected ? 'var(--gold-bd)' : 'var(--border)'}`,
      borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', transition: 'all .2s',
    }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor='var(--border2)'; e.currentTarget.style.transform='translateY(-2px)' }}}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='translateY(0)' }}}
    >
      <div style={{ height: '3px', background: stripeColor }} />
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '3px' }}>{c.nome}</div>
            <div style={{ display: 'flex', gap: '5px' }}>
              {c.plataforma && <span style={{ fontSize: '9px', background:'var(--border)', padding:'2px 6px', borderRadius:'3px', color:'var(--txt2)', fontFamily:"'JetBrains Mono',monospace" }}>{c.plataforma}</span>}
            </div>
          </div>
          <Badge status={c.status_dia} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
          {[
            { lbl: 'Hoje', val: R(c.lucro_hoje), col: c.lucro_hoje > 0 ? 'var(--green)' : c.lucro_hoje < 0 ? 'var(--red)' : 'var(--txt2)' },
            { lbl: `Ciclo · ${c.periodo_label}`, val: R(c.lucro_ciclo), col: c.lucro_ciclo > 0 ? 'var(--green)' : c.lucro_ciclo < 0 ? 'var(--red)' : 'var(--txt2)' },
          ].map(({ lbl, val, col }) => (
            <div key={lbl} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'7px', padding:'9px 11px' }}>
              <div style={{ fontSize:'9px', color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:'4px' }}>{lbl}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'16px', fontWeight:700, color:col }}>{val}</div>
            </div>
          ))}
        </div>

        {c.meta_mensal > 0 && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'9px', color:'var(--txt3)', marginBottom:'3px' }}>
              <span>Meta: {R(c.meta_mensal)}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", color: metaPct >= 100 ? 'var(--green)' : 'inherit' }}>{metaPct.toFixed(1)}%</span>
            </div>
            <div style={{ height:'3px', background:'var(--border)', borderRadius:'2px' }}>
              <div style={{ width:`${metaPct}%`, height:'100%', borderRadius:'2px', transition:'width .5s', background: c.status_mes === 'META_MES' ? 'var(--green)' : 'linear-gradient(90deg,var(--gold),var(--gold2))' }} />
            </div>
          </div>
        )}

        {c.loss_limit_ciclo > 0 && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'9px', color:'var(--txt3)', marginBottom:'3px' }}>
              <span>Loss limit</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", color: stopPct >= 70 ? 'var(--red)' : 'inherit' }}>{stopPct.toFixed(1)}%</span>
            </div>
            <div style={{ height:'3px', background:'var(--border)', borderRadius:'2px' }}>
              <div style={{ width:`${stopPct}%`, height:'100%', borderRadius:'2px', transition:'width .5s', background: stopPct >= 70 ? 'var(--red)' : stopPct >= 40 ? 'var(--yellow)' : 'var(--green)' }} />
            </div>
            {stopPct >= 70 && (
              <div style={{ marginTop:'8px', padding:'8px 11px', borderRadius:'7px', background:'rgba(255,82,82,.12)', border:'1px solid rgba(255,82,82,.35)', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'16px', flexShrink:0 }}>⚠️</span>
                <div>
                  <div style={{ fontSize:'11px', fontWeight:700, color:'var(--red)' }}>Loss limit crítico: {stopPct.toFixed(1)}%</div>
                  <div style={{ fontSize:'10px', color:'var(--txt3)', marginTop:'2px' }}>Considere pausar operações nessa conta.</div>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display:'flex', gap:'4px', paddingTop:'9px', borderTop:'1px solid var(--border)' }}>
          {[
            { lbl: 'Stop/Dia', val: c.stop_diario > 0 ? R(-c.stop_diario) : '—', col: 'var(--red)' },
            { lbl: 'Dias Sobrev.', val: diasSobrev !== null ? diasSobrev : '—', col: diasSobrev !== null && diasSobrev <= 2 ? 'var(--red)' : diasSobrev !== null && diasSobrev <= 5 ? 'var(--yellow)' : 'var(--green)' },
            { lbl: 'Falta p/ Meta', val: c.falta_meta <= 0 ? '✓ Batida' : R(c.falta_meta), col: c.falta_meta <= 0 ? 'var(--green)' : 'var(--txt)' },
          ].map(({ lbl, val, col }) => (
            <div key={lbl} style={{ flex:1, textAlign:'center', background:'var(--bg3)', borderRadius:'6px', padding:'8px 4px' }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:700, color:col, lineHeight:1, marginBottom:'4px' }}>{val}</div>
              <div style={{ fontSize:'8px', color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'.4px' }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Calculadora de Contratos ────────────────────────────────────────────────
const CUSTO_WIN = 0.15  // R$ por contrato round trip (emolumentos + registro B3)
const CUSTO_WDO = 1.50  // R$ por contrato round trip

function calcContratos(capital, riscoPct, stopWin, stopWdo) {
  const risco = capital * (riscoPct / 100)
  const ctsWin = Math.max(1, Math.floor(risco / (stopWin * 0.20)))
  const ctsWdo = Math.max(1, Math.floor(risco / (stopWdo * 10.00)))
  return {
    risco,
    win: {
      cts:       ctsWin,
      stop_pts:  stopWin,
      stop_r:    ctsWin * stopWin * 0.20,
      alvo_r:    ctsWin * stopWin * 0.20 * 2,
      custo:     +(ctsWin * CUSTO_WIN).toFixed(2),
      breakeven: Math.ceil((ctsWin * CUSTO_WIN) / (ctsWin * 0.20)),
      margem:    ctsWin * 100,  // ~R$100/contrato WIN
    },
    wdo: {
      cts:       ctsWdo,
      stop_pts:  stopWdo,
      stop_r:    ctsWdo * stopWdo * 10.00,
      alvo_r:    ctsWdo * stopWdo * 10.00 * 2,
      custo:     +(ctsWdo * CUSTO_WDO).toFixed(2),
      breakeven: Math.ceil((ctsWdo * CUSTO_WDO) / (ctsWdo * 10.00)),
      margem:    ctsWdo * 200,  // ~R$200/contrato WDO
    },
  }
}

function CalculadoraSection({ contas, selConta }) {
  const c = contas.find(x => x.id === selConta)
  if (!c || !parseFloat(c.capital_disponivel)) return null

  const capital  = parseFloat(c.capital_disponivel) || 0
  const riscoPct = parseFloat(c.risco_pct) || 1
  const stopWin  = parseInt(c.stop_pts_win) || 200
  const stopWdo  = parseInt(c.stop_pts_wdo) || 100
  const inst     = c.instrumento || 'WIN'

  const calc = calcContratos(capital, riscoPct, stopWin, stopWdo)
  const roi  = capital > 0 ? (parseFloat(c.lucro_ciclo) / capital * 100) : 0
  const roiMeta = capital > 0 && c.meta_mensal > 0 ? (c.meta_mensal / capital * 100) : 0

  const blk = (label, val, sub, col = 'var(--txt)') => (
    <div key={label} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'8px', padding:'10px 13px', minWidth:'90px' }}>
      <div style={{ fontSize:'9px', color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'.8px', marginBottom:'3px' }}>{label}</div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'16px', fontWeight:700, color:col, lineHeight:1 }}>{val}</div>
      {sub && <div style={{ fontSize:'9px', color:'var(--txt3)', marginTop:'3px' }}>{sub}</div>}
    </div>
  )

  const instrBlock = (nome, d, cor) => (
    <div style={{ background:'var(--bg2)', border:`1px solid ${cor}22`, borderRadius:'10px', padding:'12px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
        <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:cor }} />
        <span style={{ fontSize:'11px', fontWeight:700, color:cor, textTransform:'uppercase', letterSpacing:'1px' }}>{nome}</span>
        <span style={{ fontSize:'10px', color:'var(--txt3)' }}>· {nome === 'WIN' ? 'R$ 0,20/pt/ct' : 'R$ 10,00/pt/ct'}</span>
      </div>
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
        {blk('Contratos', d.cts, `${d.margem > 0 ? 'Margem ~'+R(d.margem) : ''}`, cor)}
        {blk('Stop', `${d.stop_pts}pts`, R(-d.stop_r), 'var(--red)')}
        {blk('Alvo 1:2', `${d.stop_pts*2}pts`, R(d.alvo_r), 'var(--green)')}
        {blk('Break-even', `${d.breakeven}pts`, `Custo ${R(d.custo)}`, 'var(--txt3)')}
      </div>
    </div>
  )

  return (
    <div style={{ marginBottom:'18px' }}>
      <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'var(--txt3)', marginBottom:'10px', display:'flex', alignItems:'center', gap:'8px' }}>
        Calculadora <div style={{ flex:1, height:'1px', background:'var(--border)' }} />
        <span style={{ fontWeight:400, fontSize:'9px' }}>Capital: {R(capital)} · Risco: {riscoPct}% = {R(calc.risco)}/operação</span>
      </div>

      <div style={{ display:'grid', gap:'8px', gridTemplateColumns: inst === 'AMBOS' ? '1fr 1fr' : '1fr' }}>
        {(inst === 'WIN' || inst === 'AMBOS') && instrBlock('WIN', calc.win, '#4caf82')}
        {(inst === 'WDO' || inst === 'AMBOS') && instrBlock('WDO', calc.wdo, '#5b9cf6')}
      </div>

      <div style={{ display:'flex', gap:'8px', marginTop:'8px', flexWrap:'wrap' }}>
        {blk('ROI Ciclo', `${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%`, `sobre ${R(capital)}`, roi >= 0 ? 'var(--green)' : 'var(--red)')}
        {roiMeta > 0 && blk('Meta ROI', `${roiMeta.toFixed(2)}%/mês`, `= ${R(c.meta_mensal)}`, 'var(--gold)')}
        {c.custo_renovacao > 0 && blk('Renovação', R(-c.custo_renovacao), 'custo fixo ciclo', 'var(--txt3)')}
      </div>
    </div>
  )
}

// ─── Vista Consolidada ────────────────────────────────────────────────────────
function ConsolidadoSection({ contas }) {
  if (!contas.length) return null
  const total     = contas.reduce((s, c) => s + parseFloat(c.lucro_ciclo || 0), 0)
  const hoje      = contas.reduce((s, c) => s + parseFloat(c.lucro_hoje || 0), 0)
  const capital   = contas.reduce((s, c) => s + parseFloat(c.capital_disponivel || 0), 0)
  const metaTotal = contas.reduce((s, c) => s + parseFloat(c.meta_mensal || 0), 0)
  const roi       = capital > 0 ? (total / capital * 100) : 0
  const metaPct   = metaTotal > 0 ? Math.min(100, (total / metaTotal) * 100) : 0

  const items = [
    { lbl: 'Capital Total',    val: capital > 0 ? R(capital) : '—',       col: 'var(--txt)' },
    { lbl: 'Resultado Ciclo',  val: R(total),  col: total >= 0 ? 'var(--green)' : 'var(--red)' },
    { lbl: 'Resultado Hoje',   val: R(hoje),   col: hoje  >= 0 ? 'var(--green)' : 'var(--red)' },
    { lbl: 'ROI',              val: capital > 0 ? `${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%` : '—', col: roi >= 0 ? 'var(--green)' : 'var(--red)' },
  ]

  return (
    <div style={{ marginBottom:'18px' }}>
      <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'var(--txt3)', marginBottom:'10px', display:'flex', alignItems:'center', gap:'8px' }}>
        Consolidado — todas as contas <div style={{ flex:1, height:'1px', background:'var(--border)' }} />
      </div>
      <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'10px' }}>
        {items.map(({ lbl, val, col }) => (
          <div key={lbl} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'12px 18px', flex:1, minWidth:'130px' }}>
            <div style={{ fontSize:'9px', color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px' }}>{lbl}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'22px', fontWeight:700, color:col, lineHeight:1 }}>{val}</div>
          </div>
        ))}
      </div>
      {metaTotal > 0 && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'12px 18px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'var(--txt3)', marginBottom:'6px' }}>
            <span>Meta mensal consolidada: {R(metaTotal)}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", color: metaPct >= 100 ? 'var(--green)' : 'var(--gold)' }}>{metaPct.toFixed(1)}%</span>
          </div>
          <div style={{ height:'4px', background:'var(--border)', borderRadius:'2px' }}>
            <div style={{ width:`${metaPct}%`, height:'100%', borderRadius:'2px', background: metaPct >= 100 ? 'var(--green)' : 'linear-gradient(90deg,var(--gold),var(--gold2))', transition:'width .5s' }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Seção MERCADO ───────────────────────────────────────────────────────────
function MercadoSection({ contas, selConta }) {
  const cal = calcCalendario()
  const c   = contas.find(x => x.id === selConta) || contas[0]

  let media = 0, faltaFmt = '—', mediaSub = ''
  let decisaoClass = 'ok', decisaoText = '—'

  if (c) {
    const falta = Math.max(0, c.meta_mensal - c.lucro_ciclo)
    media = cal.restantes > 0 ? falta / cal.restantes : falta
    faltaFmt = R(falta)
    mediaSub = `Faltam ${faltaFmt} · ${cal.restantes} pregões`

    if (c.status_mes === 'STOP_MES' || c.semaforo === 'stop') { decisaoClass = 'stop'; decisaoText = `🚨 ${c.nome} — Parar agora` }
    else if (c.status_dia === 'STOP_DIA') { decisaoClass = 'stop'; decisaoText = `🛑 ${c.nome} — Encerrar o dia` }
    else if (c.status_dia === 'QUASE_STOP') { decisaoClass = 'warn'; decisaoText = `⚠️ ${c.nome} — Próximo do stop` }
    else if (c.status_mes === 'META_MES' || c.status_dia === 'META_DIA') { decisaoClass = 'ok'; decisaoText = `🏆 ${c.nome} — Meta atingida!` }
    else if (c.semaforo === 'vermelho') { decisaoClass = 'warn'; decisaoText = `⚠️ ${c.nome} — Ciclo crítico` }
    else { decisaoClass = 'ok'; decisaoText = `✓ ${c.nome} — Liberado para operar` }
  }

  const pillStyle = {
    ok:   { bg:'rgba(76,175,130,.08)',  bd:'rgba(76,175,130,.25)',  col:'var(--green)' },
    warn: { bg:'rgba(212,168,67,.08)', bd:'rgba(212,168,67,.25)', col:'var(--yellow)' },
    stop: { bg:'rgba(224,92,106,.08)', bd:'rgba(224,92,106,.25)', col:'var(--red)'    },
  }[decisaoClass]

  const items = [
    { lbl: 'Pregões Restantes', val: cal.restantes, sub: `de ${cal.total} no mês`, col: 'var(--green)' },
    { lbl: 'Pregões no Mês',   val: cal.passados,  sub: cal.mes, col: 'var(--txt2)' },
    { lbl: 'Hoje é Pregão?',   val: cal.isHoje ? '✓ Sim' : '✗ Não', sub: null, col: cal.isHoje ? 'var(--green)' : 'var(--red)' },
    { lbl: c ? `Média Necessária — ${c.nome}` : 'Média Necessária', val: R(media), sub: mediaSub, col: c && media <= c.meta_diaria ? 'var(--green)' : 'var(--yellow)' },
  ]

  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'var(--txt3)', marginBottom:'10px', display:'flex', alignItems:'center', gap:'8px' }}>
        Mercado <div style={{ flex:1, height:'1px', background:'var(--border)' }} />
      </div>
      <div style={{ display:'flex', gap:'10px', alignItems:'stretch', flexWrap:'wrap' }}>
        {items.map(({ lbl, val, sub, col }) => (
          <div key={lbl} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'10px', padding:'11px 16px', flex:1, minWidth:'130px' }}>
            <div style={{ fontSize:'9px', color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'4px' }}>{lbl}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'22px', fontWeight:700, color:col, lineHeight:1 }}>{val}</div>
            {sub && <div style={{ fontSize:'10px', color:'var(--txt3)', marginTop:'3px' }}>{sub}</div>}
          </div>
        ))}
        <div style={{ background:pillStyle.bg, border:`1px solid ${pillStyle.bd}`, borderRadius:'10px', padding:'11px 20px', fontSize:'13px', fontWeight:700, color:pillStyle.col, display:'flex', alignItems:'center', whiteSpace:'nowrap' }}>
          {decisaoText}
        </div>
      </div>
    </div>
  )
}

// ─── Parser CSV Profit ───────────────────────────────────────────────────────
function parseProfitCSV(text) {
  // normaliza encoding — substitui sequências corrompidas comuns (Windows-1252 via FileReader latin1)
  const lines = text.split(/\r?\n/)

  // acha a linha de cabeçalho (contém "Ativo" e "Abertura")
  let headerIdx = lines.findIndex(l => l.includes('Ativo') && l.includes('Abertura'))
  if (headerIdx === -1) throw new Error('Formato não reconhecido — não achei o cabeçalho do Profit')

  const dataLines = lines.slice(headerIdx + 1).filter(l => l.trim() && !l.startsWith('Conta') && !l.startsWith('Titular'))

  return dataLines.map((line, i) => {
    const cols = line.split(';')
    if (cols.length < 13) return null

    // col 1: Abertura "23/10/2026 10:11:26"
    const abertura  = cols[1]?.trim() || ''
    const fechamento = cols[2]?.trim() || ''
    const [datePart, timePart] = abertura.split(' ')
    const [, timeSai] = (fechamento.split(' '))
    if (!datePart) return null

    // converte DD/MM/YYYY → YYYY-MM-DD
    const [d, m, y] = datePart.split('/')
    const dataOp = `${y}-${m}-${d}`

    const lado = cols[6]?.trim() || 'C'
    const tipo = lado === 'V' ? 'VENDA' : 'COMPRA'

    // col 10: Res. Intervalo Bruto (R$) — resultado financeiro
    const parseBR = v => parseFloat((v || '0').replace(/\./g,'').replace(',','.')) || 0
    const resultado = parseBR(cols[12])  // Res. Operação (R$)
    const pontos    = parseBR(cols[13])  // Res. Operação (pts)
    const ativo     = cols[0]?.trim() || ''
    const qtd       = cols[4]?.trim() || cols[5]?.trim() || '1'

    return {
      data_operacao:   dataOp,
      tipo,
      horario_entrada: (timePart  || '09:00').slice(0, 5),
      horario_saida:   (timeSai   || '09:00').slice(0, 5),
      pontos,
      resultado,
      custo:           0,
      observacao:      `${ativo} (${qtd} cts) — Profit`,
    }
  }).filter(Boolean)
}

// ─── Painel Import CSV ────────────────────────────────────────────────────────
function CsvImportPanel({ contas, selConta, onSuccess }) {
  const [cid,      setCid]      = useState(selConta || '')
  const [preview,  setPreview]  = useState(null)   // array de ops parsed
  const [fileName, setFileName] = useState('')
  const [msg,      setMsg]      = useState('')
  const [loading,  setLoading]  = useState(false)
  const [platform, setPlatform] = useState('profit')

  useEffect(() => { if (selConta) setCid(selConta) }, [selConta])

  const inp = { width:'100%', padding:'7px 9px', borderRadius:'6px', fontSize:'12px', background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--txt)', outline:'none' }
  const lbl = { fontSize:'9px', color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'1px', display:'block', marginBottom:'3px' }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setMsg(''); setPreview(null)

    const reader = new FileReader()
    reader.onload = ev => {
      try {
        let text = ev.target.result
        const ops = platform === 'profit' ? parseProfitCSV(text) : []
        if (!ops.length) { setMsg('⚠ Nenhuma operação encontrada no arquivo.'); return }
        setPreview(ops)
      } catch (err) { setMsg('⚠ ' + err.message) }
    }
    reader.readAsText(file, 'windows-1252')
  }

  async function importar() {
    if (!cid || !preview?.length) return
    setLoading(true); setMsg('')
    try {
      const r = await api.post('operacoes', { action: 'importar', conta_id: parseInt(cid), ops: preview })
      setMsg(`✓ ${r.inserted} operações importadas!`)
      setPreview(null); setFileName('')
      onSuccess()
    } catch (err) { setMsg('⚠ ' + err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
        <div>
          <label style={lbl}>Plataforma</label>
          <select style={inp} value={platform} onChange={e => { setPlatform(e.target.value); setPreview(null); setFileName('') }}>
            <option value="profit">Profit (Nelogica)</option>
            <option value="other" disabled>MT5 — em breve</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Conta destino</label>
          <select style={inp} value={cid} onChange={e => setCid(e.target.value)}>
            {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
      </div>

      <label style={{ display:'block', border:'2px dashed var(--border2)', borderRadius:'8px', padding:'18px', textAlign:'center', cursor:'pointer', background:'var(--bg3)', color:'var(--txt3)', fontSize:'12px' }}>
        <input type="file" accept=".csv,.txt" style={{ display:'none' }} onChange={handleFile} />
        {fileName ? <><div style={{ color:'var(--txt)', fontWeight:700, marginBottom:'3px' }}>📄 {fileName}</div><div>clique para trocar</div></> : <><div style={{ fontSize:'22px', marginBottom:'4px' }}>📂</div><div>Clique para selecionar o CSV do Profit</div><div style={{ fontSize:'10px', marginTop:'3px' }}>Exportar em: Relatório → Operações Realizadas → CSV</div></>}
      </label>

      {preview && (
        <div style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'8px', padding:'10px', maxHeight:'160px', overflowY:'auto' }}>
          <div style={{ fontSize:'10px', color:'var(--txt3)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'1px' }}>{preview.length} operações detectadas</div>
          {preview.map((op, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid var(--border)', fontSize:'11px' }}>
              <span style={{ color:'var(--txt3)' }}>{op.data_operacao} {op.horario_entrada}</span>
              <span style={{ color: op.tipo === 'COMPRA' ? 'var(--green)' : 'var(--red)', fontWeight:700 }}>{op.tipo}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color: op.resultado >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {op.resultado >= 0 ? '+' : ''}R$ {op.resultado.toLocaleString('pt-BR', { minimumFractionDigits:2 })}
              </span>
            </div>
          ))}
        </div>
      )}

      {msg && <div style={{ fontSize:'12px', padding:'8px 10px', borderRadius:'6px', textAlign:'center', background: msg.startsWith('✓') ? 'rgba(76,175,130,.08)' : 'rgba(224,92,106,.08)', border: `1px solid ${msg.startsWith('✓') ? 'rgba(76,175,130,.25)' : 'rgba(224,92,106,.25)'}`, color: msg.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{msg}</div>}

      <button onClick={importar} disabled={!preview?.length || loading} style={{ width:'100%', padding:'11px', background:'linear-gradient(135deg,#c9a84c,#e8c97a)', color:'#0c0c0e', border:'none', borderRadius:'7px', fontSize:'13px', fontWeight:800, opacity:(!preview?.length || loading) ? .5 : 1, cursor: preview?.length ? 'pointer' : 'not-allowed' }}>
        {loading ? 'IMPORTANDO…' : preview ? `IMPORTAR ${preview.length} OPERAÇÕES` : 'SELECIONE UM ARQUIVO'}
      </button>
    </div>
  )
}

// ─── Painel Registrar ────────────────────────────────────────────────────────
function RegisterPanel({ contas, selConta, onSuccess }) {
  const hoje = hojeISO(), hora = horaAtual()
  const [cid,  setCid]  = useState(selConta || '')
  const [tipo, setTipo] = useState('COMPRA')
  const [pts,  setPts]  = useState('')
  const [res,  setRes]  = useState('')
  const [ent,  setEnt]  = useState(hora)
  const [sai,  setSai]  = useState(hora)
  const [obs,  setObs]  = useState('')
  const [msg,  setMsg]  = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (selConta) setCid(selConta) }, [selConta])

  const preview = parseFloat(res) || 0
  const prevCol = preview > 0 ? 'var(--green)' : preview < 0 ? 'var(--red)' : 'var(--txt3)'
  const prevTxt = res ? R(preview) : '— preencha o resultado —'

  async function registrar() {
    if (!cid || !res) { setMsg('Conta e resultado obrigatórios'); return }
    setSaving(true); setMsg('')
    try {
      await api.post('operacoes', {
        action: 'salvar', conta_id: parseInt(cid), data_operacao: hoje,
        tipo, horario_entrada: ent, horario_saida: sai,
        pontos: parseFloat(pts) || 0, resultado: parseFloat(res), custo: 0, observacao: obs,
      })
      setPts(''); setRes(''); setObs('')
      setEnt(horaAtual()); setSai(horaAtual())
      setMsg('✓ Registrado!')
      setTimeout(() => setMsg(''), 2500)
      onSuccess()
    } catch (err) { setMsg('⚠ ' + err.message) }
    finally { setSaving(false) }
  }

  const inp = { width:'100%', padding:'7px 9px', borderRadius:'6px', fontSize:'12px', background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--txt)', outline:'none' }
  const lbl = { fontSize:'9px', color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'1px', display:'block', marginBottom:'3px' }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
        <span style={{ fontSize:'9px', color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'1px' }}>Conta:</span>
        <select style={{ ...inp, width:'auto', flex:1 }} value={cid} onChange={e => setCid(e.target.value)}>
          {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
        <div><label style={lbl}>Tipo</label>
          <select style={inp} value={tipo} onChange={e => setTipo(e.target.value)}>
            <option>COMPRA</option><option>VENDA</option>
          </select>
        </div>
        <div><label style={lbl}>Resultado (R$)</label>
          <input style={inp} type="number" placeholder="ex: 600 ou -250" value={res} onChange={e => setRes(e.target.value)} />
        </div>
        <div><label style={lbl}>Pontos (ref.)</label>
          <input style={inp} type="number" placeholder="ex: 300" value={pts} onChange={e => setPts(e.target.value)} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px', gridColumn:'1/-1' }}>
          <div><label style={lbl}>Entrada</label><input style={inp} type="time" value={ent} onChange={e => setEnt(e.target.value)} /></div>
          <div><label style={lbl}>Saída</label>  <input style={inp} type="time" value={sai} onChange={e => setSai(e.target.value)} /></div>
        </div>
        <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Observação</label>
          <textarea style={{ ...inp, resize:'vertical', minHeight:'44px' }} placeholder="Setup, contexto..." value={obs} onChange={e => setObs(e.target.value)} />
        </div>
      </div>

      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'16px', fontWeight:700, textAlign:'center', padding:'9px', borderRadius:'6px', background:'var(--bg3)', border:'1px solid var(--border2)', color:prevCol, transition:'.3s' }}>
        {prevTxt}
      </div>

      {msg && <div style={{ fontSize:'12px', padding:'8px 10px', borderRadius:'6px', textAlign:'center', background: msg.startsWith('✓') ? 'rgba(76,175,130,.08)' : 'rgba(224,92,106,.08)', border: `1px solid ${msg.startsWith('✓') ? 'rgba(76,175,130,.25)' : 'rgba(224,92,106,.25)'}`, color: msg.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{msg}</div>}

      <button onClick={registrar} disabled={saving} style={{ width:'100%', padding:'11px', background:'linear-gradient(135deg,#c9a84c,#e8c97a)', color:'#0c0c0e', border:'none', borderRadius:'7px', fontSize:'13px', fontWeight:800, opacity:saving?.7:1 }}>
        {saving ? 'REGISTRANDO…' : 'REGISTRAR OPERAÇÃO'}
      </button>
    </div>
  )
}

// ─── Painel Operações ─────────────────────────────────────────────────────────
function OpsPanel({ contas, selConta }) {
  const [tab,  setTab]  = useState('hoje')
  const [cid,  setCid]  = useState(selConta || '')
  const [ops,  setOps]  = useState([])
  const [mes,  setMes]  = useState(hojeISO().slice(0, 7))
  const [load, setLoad] = useState(false)

  useEffect(() => { if (selConta) setCid(selConta) }, [selConta])
  useEffect(() => { fetchOps() }, [cid, tab, mes])

  async function fetchOps() {
    if (!cid) return
    setLoad(true)
    try {
      const qs = tab === 'hoje' ? `operacoes?conta_id=${cid}&data=${hojeISO()}` : `operacoes?conta_id=${cid}`
      setOps(await api.get(qs))
    } catch { setOps([]) }
    finally { setLoad(false) }
  }

  async function excluir(id) {
    if (!confirm('Excluir operação?')) return
    await api.post('operacoes', { action: 'excluir', id })
    fetchOps()
  }

  const pill = (tipo) => ({
    display:'inline-block', padding:'2px 7px', borderRadius:'20px',
    fontSize:'9px', fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
    background: tipo==='COMPRA' ? 'rgba(77,159,255,.15)' : 'rgba(212,168,67,.15)',
    color: tipo==='COMPRA' ? '#4d9fff' : 'var(--yellow)',
  })

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{
      padding:'5px 11px', borderRadius:'5px', fontSize:'11px', fontWeight:600, border:'none',
      background: tab===id ? 'var(--gold-bg)' : 'transparent',
      color: tab===id ? 'var(--gold)' : 'var(--txt3)',
      cursor:'pointer',
    }}>{label}</button>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
        <span style={{ fontSize:'9px', color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'1px' }}>Conta:</span>
        <select style={{ padding:'5px 8px', borderRadius:'5px', fontSize:'11px', background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--txt)', outline:'none' }}
          value={cid} onChange={e => setCid(e.target.value)}>
          {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        {tab === 'hist' && (
          <input type="month" value={mes} onChange={e => setMes(e.target.value)}
            style={{ padding:'5px 8px', borderRadius:'5px', fontSize:'11px', background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--txt)', outline:'none' }} />
        )}
      </div>

      <div style={{ display:'flex', gap:'3px' }}>
        <TabBtn id="hoje" label="Hoje" />
        <TabBtn id="hist" label="Histórico" />
      </div>

      <div style={{ maxHeight:'260px', overflowY:'auto' }}>
        {load ? (
          <p style={{ textAlign:'center', padding:'20px', fontSize:'12px', color:'var(--txt3)' }}>Carregando…</p>
        ) : ops.length === 0 ? (
          <p style={{ textAlign:'center', padding:'22px', fontSize:'12px', color:'var(--txt3)' }}>Nenhuma operação</p>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'11px' }}>
            <thead>
              <tr>{['Hora','Tipo','Pts','R$',''].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'6px 8px', fontSize:'9px', letterSpacing:'1px', color:'var(--txt3)', textTransform:'uppercase', borderBottom:'1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {ops.map(o => (
                <tr key={o.id}>
                  <td style={{ padding:'7px 8px', borderBottom:'1px solid var(--border)', fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'var(--txt2)' }}>
                    {tab === 'hist' ? (o.data_operacao||'').slice(5).split('-').reverse().join('/') : (o.horario_entrada||'').slice(0,5)}
                  </td>
                  <td style={{ padding:'7px 8px', borderBottom:'1px solid var(--border)' }}><span style={pill(o.tipo)}>{o.tipo}</span></td>
                  <td style={{ padding:'7px 8px', borderBottom:'1px solid var(--border)', fontFamily:"'JetBrains Mono',monospace", color: parseFloat(o.pontos)>0?'var(--green)':'var(--red)' }}>
                    {parseFloat(o.pontos)>0?'+':''}{parseFloat(o.pontos)||0}
                  </td>
                  <td style={{ padding:'7px 8px', borderBottom:'1px solid var(--border)', fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color: parseFloat(o.resultado)>0?'var(--green)':'var(--red)' }}>
                    {R(parseFloat(o.resultado))}
                  </td>
                  <td style={{ padding:'7px 8px', borderBottom:'1px solid var(--border)' }}>
                    <button onClick={() => excluir(o.id)} style={{ background:'none', border:'none', color:'var(--txt3)', cursor:'pointer', fontSize:'12px', padding:'2px 5px', borderRadius:'3px' }}
                      onMouseEnter={e => e.target.style.color='var(--red)'}
                      onMouseLeave={e => e.target.style.color='var(--txt3)'}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Painel wrapper ───────────────────────────────────────────────────────────
function Panel({ title, tabs, activeTab, onTab, children }) {
  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'13px', fontWeight:700 }}>{title}</span>
        {tabs && (
          <div style={{ display:'flex', gap:'3px' }}>
            {tabs.map(({ id, label }) => (
              <button key={id} onClick={() => onTab(id)} style={{
                padding:'4px 10px', borderRadius:'5px', fontSize:'11px', fontWeight:600, border:'none', cursor:'pointer',
                background: activeTab===id ? 'var(--gold-bg)' : 'transparent',
                color: activeTab===id ? 'var(--gold)' : 'var(--txt3)',
              }}>{label}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding:'16px' }}>{children}</div>
    </div>
  )
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  const [contas,  setContas]  = useState([])
  const [loading, setLoading] = useState(true)
  const [erro,    setErro]    = useState('')
  const [selId,   setSelId]   = useState(null)
  const [regTab,  setRegTab]  = useState('csv')

  const load = useCallback(async () => {
    setLoading(true); setErro('')
    try {
      const data = await api.get('dashboard')
      setContas(data)
      if (!selId && data.length) setSelId(data[0].id)
    } catch (err) { setErro(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' })
  const cap  = s => s.charAt(0).toUpperCase() + s.slice(1)

  return (
    <>
      <Nav />
      <main style={{ padding:'20px 24px', maxWidth:'1440px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
          <div>
            <h1 style={{ fontSize:'17px', fontWeight:700, marginBottom:'2px' }}>Dashboard</h1>
            <p style={{ fontSize:'11px', color:'var(--txt3)' }}>{cap(hoje)}</p>
          </div>
          <button onClick={load} disabled={loading} style={{ padding:'7px 14px', borderRadius:'7px', fontSize:'12px', fontWeight:600, background:'var(--bg2)', border:'1px solid var(--border2)', color:'var(--txt2)', opacity:loading?.6:1 }}>
            ↺ Atualizar
          </button>
        </div>

        {erro && <div style={{ padding:'10px 14px', borderRadius:'7px', fontSize:'12px', background:'rgba(224,92,106,.08)', border:'1px solid rgba(224,92,106,.25)', color:'var(--red)', marginBottom:'14px' }}>{erro}</div>}

        {/* Contas */}
        {loading ? (
          <p style={{ color:'var(--txt3)', fontSize:'12px', textAlign:'center', padding:'32px 0' }}>Carregando…</p>
        ) : contas.length === 0 ? (
          <div style={{ marginBottom:'18px' }}>
            <div style={{ textAlign:'center', marginBottom:'36px' }}>
              <div style={{ fontSize:'36px', marginBottom:'12px' }}>📊</div>
              <h2 style={{ fontSize:'22px', fontWeight:800, marginBottom:'6px' }}>Bem-vindo ao TraderSystem</h2>
              <p style={{ fontSize:'13px', color:'var(--txt3)' }}>Escolha o tipo de conta para começar</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'16px', maxWidth:'720px', margin:'0 auto' }}>
              {[
                {
                  tipo:'pessoal', icon:'👤', titulo:'Conta Pessoal',
                  cor:'#5ba4f5', corBg:'rgba(91,164,245,.08)', corBd:'rgba(91,164,245,.25)',
                  desc:'Opera com capital próprio e define seu próprio ritmo de gestão.',
                  bullets:['Stop diário e mensal personalizados','Ciclo = mês corrente (sem renovação)','Sem loss limit obrigatório','Ideal para capital próprio'],
                },
                {
                  tipo:'mesa', icon:'🏢', titulo:'Mesa Proprietária',
                  cor:'var(--yellow)', corBg:'rgba(212,168,67,.08)', corBd:'rgba(212,168,67,.25)',
                  desc:'Capital fornecido pela mesa com regras rígidas de ciclo e drawdown.',
                  bullets:['Loss limit por ciclo obrigatório','Custo de renovação a cada ciclo','Regras da mesa predefinidas','Ideal para capital de terceiros'],
                },
              ].map(({ tipo, icon, titulo, cor, corBg, corBd, desc, bullets }) => (
                <a key={tipo} href={`/config?novo=${tipo}`} style={{ textDecoration:'none' }}>
                  <div style={{ background:'var(--bg2)', border:`1px solid ${corBd}`, borderRadius:'16px', padding:'28px 24px', cursor:'pointer', transition:'all .2s', display:'flex', flexDirection:'column', height:'100%', boxSizing:'border-box' }}
                    onMouseEnter={e => { e.currentTarget.style.background=corBg; e.currentTarget.style.transform='translateY(-3px)' }}
                    onMouseLeave={e => { e.currentTarget.style.background='var(--bg2)'; e.currentTarget.style.transform='translateY(0)' }}>
                    <div style={{ fontSize:'36px', marginBottom:'12px' }}>{icon}</div>
                    <div style={{ fontSize:'18px', fontWeight:800, color:cor, marginBottom:'8px' }}>{titulo}</div>
                    <p style={{ fontSize:'12px', color:'var(--txt3)', marginBottom:'18px', lineHeight:1.7 }}>{desc}</p>
                    <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:'7px', flex:1 }}>
                      {bullets.map(b => (
                        <li key={b} style={{ display:'flex', gap:'8px', fontSize:'12px', color:'var(--txt2)', alignItems:'flex-start' }}>
                          <span style={{ color:cor, flexShrink:0 }}>✓</span>{b}
                        </li>
                      ))}
                    </ul>
                    <div style={{ marginTop:'22px', padding:'11px', background:corBg, border:`1px solid ${corBd}`, borderRadius:'8px', textAlign:'center', fontSize:'13px', fontWeight:700, color:cor }}>
                      Configurar →
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Seletor de contas */}
            <div style={{ display:'flex', gap:'6px', marginBottom:'14px', flexWrap:'wrap' }}>
              <button onClick={() => setSelId(null)} style={{ padding:'6px 14px', borderRadius:'7px', fontSize:'12px', fontWeight:600, border:'1px solid var(--border2)', cursor:'pointer', background: selId === null ? 'var(--gold-bg)' : 'var(--bg2)', color: selId === null ? 'var(--gold)' : 'var(--txt3)', borderColor: selId === null ? 'var(--gold-bd)' : 'var(--border2)' }}>
                Todas ({contas.length})
              </button>
              {contas.map(c => (
                <button key={c.id} onClick={() => setSelId(c.id)} style={{ padding:'6px 14px', borderRadius:'7px', fontSize:'12px', fontWeight:600, border:'1px solid var(--border2)', cursor:'pointer', background: selId === c.id ? 'var(--bg3)' : 'var(--bg2)', color: selId === c.id ? 'var(--txt)' : 'var(--txt3)', borderColor: selId === c.id ? 'var(--gold-bd)' : 'var(--border2)' }}>
                  {c.nome}
                </button>
              ))}
            </div>

            {/* Consolidado (quando "Todas" selecionado) */}
            {selId === null && <ConsolidadoSection contas={contas} />}

            {/* Cards de conta */}
            {selId !== null && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'12px', marginBottom:'18px' }}>
                <ContaCard c={contas.find(x => x.id === selId)} selected onClick={() => {}} />
              </div>
            )}

            {/* Calculadora (apenas com conta selecionada) */}
            <CalculadoraSection contas={contas} selConta={selId} />

            {/* Mercado */}
            {selId !== null && <MercadoSection contas={contas} selConta={selId} />}

            {/* Painéis inferiores */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
              <Panel title="📝 Registrar Operação" tabs={[{id:'csv',label:'📂 Importar CSV'},{id:'manual',label:'✏️ Manual'}]} activeTab={regTab} onTab={setRegTab}>
                {regTab === 'manual' ? (
                  <RegisterPanel contas={contas} selConta={selId} onSuccess={load} />
                ) : (
                  <CsvImportPanel contas={contas} selConta={selId} onSuccess={load} />
                )}
              </Panel>

              <Panel title="Operações">
                <OpsPanel contas={contas} selConta={selId} />
              </Panel>
            </div>
          </>
        )}
      </main>
    </>
  )
}
