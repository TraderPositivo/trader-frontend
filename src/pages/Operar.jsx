import { useState, useEffect, useRef, useCallback } from 'react'
import Nav from '../components/Nav'

const API = (path) => `/.netlify/functions/${path}`
const R = (v) => {
  const s = Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (v < 0 ? '-' : '') + 'R$ ' + s
}

// ── Cockpit Bar ─────────────────────────────────────────────────────────────
function Cockpit({ g }) {
  const semCfg = {
    VERDE:      { dot: 'var(--green)', label: '✓ Liberado para operar',     border: 'rgba(0,229,160,.35)' },
    VERDE_META: { dot: 'var(--green)', label: '🏆 Meta diária atingida',     border: 'rgba(0,229,160,.35)', pulse: true },
    AMARELO:    { dot: 'var(--yellow)',label: '⚠ Atenção — opere com cautela',border: 'rgba(255,193,77,.35)' },
    VERMELHO:   { dot: 'var(--red)',   label: '🛑 Não recomendado operar',   border: 'rgba(255,69,96,.35)' },
    LIVRE:      { dot: 'var(--green)', label: '◎ Semáforo desabilitado',     border: 'rgba(0,229,160,.2)' },
  }
  const s = semCfg[g.semaforo] || semCfg.VERDE

  const pctStop = g.stop_dia > 0 ? Math.min(100, Math.abs(Math.min(0, g.res_dia)) / g.stop_dia * 100) : 0
  const pctMeta = g.meta_dia > 0 ? Math.min(100, Math.max(0, g.res_dia) / g.meta_dia * 100) : 0
  const stopFillCls = pctStop >= 75 ? 'var(--red)' : pctStop >= 50 ? 'var(--yellow)' : 'var(--green)'

  return (
    <div style={{
      display: 'flex', borderRadius: '12px', border: `2px solid ${s.border}`,
      background: 'var(--bg2)', overflow: 'hidden', marginBottom: '14px',
    }}>
      {/* Semáforo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRight: '1px solid var(--border)', minWidth: '190px' }}>
        <div style={{
          width: '13px', height: '13px', borderRadius: '50%', flexShrink: 0,
          background: s.dot, boxShadow: `0 0 8px ${s.dot}`,
          animation: s.pulse ? 'semPulse .8s infinite' : undefined,
        }} />
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, lineHeight: 1.2 }}>{s.label}</div>
          <div style={{ fontSize: '10px', color: 'var(--txt2)', marginTop: '2px', lineHeight: 1.3 }}>
            {g.motivos?.[0] || ''}
          </div>
        </div>
      </div>

      {/* Stats */}
      {[
        { lbl: 'Ops Hoje',       val: `${g.ops_hoje}/${g.max_ops}`,     cls: '' },
        { lbl: 'Resultado',      val: R(g.res_dia),                      cls: g.res_dia > 0 ? 'pos' : g.res_dia < 0 ? 'neg' : '' },
        { lbl: 'Stop Disp.',     val: g.stop_disponivel != null ? R(g.stop_disponivel) : '—',
          cls: g.stop_disponivel != null && g.stop_disponivel < (g.stop_dia * 0.3) ? 'neg'
            : g.stop_disponivel != null && g.stop_disponivel < (g.stop_dia * 0.6) ? 'warn' : 'pos' },
        { lbl: 'Ops Restantes',  val: g.ops_restantes,                   cls: g.ops_restantes === 0 ? 'neg' : '' },
        { lbl: 'Ciclo',          val: `${g.pct_ciclo}%`,                  cls: g.pct_ciclo >= 75 ? 'neg' : g.pct_ciclo >= 50 ? 'warn' : 'pos' },
      ].map(({ lbl, val, cls }) => (
        <div key={lbl} style={{ flex: 1, padding: '10px 12px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '8px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>{lbl}</div>
          <div style={{
            fontFamily: "'JetBrains Mono',monospace", fontSize: '14px', fontWeight: 700,
            color: cls === 'pos' ? 'var(--green)' : cls === 'neg' ? 'var(--red)' : cls === 'warn' ? 'var(--yellow)' : 'var(--txt)',
          }}>{val}</div>
        </div>
      ))}

      {/* Barras */}
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '7px', minWidth: '130px' }}>
        {[
          { lbl: 'Stop', pct: pctStop, fill: stopFillCls },
          { lbl: 'Meta',  pct: pctMeta, fill: pctMeta >= 100 ? 'var(--green)' : 'linear-gradient(90deg,var(--gold),var(--gold2))' },
        ].map(({ lbl, pct, fill }) => (
          <div key={lbl}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--txt3)', marginBottom: '2px' }}>
              <span>{lbl}</span><span>{pct.toFixed(0)}%</span>
            </div>
            <div style={{ height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: fill, borderRadius: '3px', transition: 'width .5s' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Calculadora ──────────────────────────────────────────────────────────────
function Calculadora({ g, inst, onInstChange }) {
  const [editOpen, setEditOpen] = useState(false)
  const [mode, setMode] = useState('sys')
  const [manStop, setManStop] = useState('')
  const [manAlvo, setManAlvo] = useState('')

  const si = inst === 'WDO' ? g?.wdo_si : g?.win_si
  const vlrPt = inst === 'WDO' ? 10.0 : 0.20
  const cts = si?.cts_sug || 1

  const modoCfg = {
    normal:  { label: '◉ Normal',       color: 'var(--gold)' },
    seguro:  { label: '◎ Modo Seguro',  color: 'var(--yellow)' },
    critico: { label: '⚠ Ciclo Crítico',color: 'var(--orange)' },
    parado:  { label: '🛑 Parado',      color: 'var(--red)' },
    meta:    { label: '🏆 Meta',        color: 'var(--green)' },
  }
  const m = modoCfg[g?.modo_atual || 'normal']

  const semBorder = g?.semaforo === 'VERMELHO' ? 'rgba(255,69,96,.4)'
    : g?.semaforo === 'AMARELO' ? 'rgba(255,193,77,.4)' : 'rgba(201,168,76,.22)'

  const activeStop = mode === 'man' && manStop
    ? { stopPts: parseInt(manStop) || 0, stopReais: (parseInt(manStop) || 0) * cts * vlrPt,
        alvoPts: parseInt(manAlvo) || 0, alvoReais: (parseInt(manAlvo) || 0) * cts * vlrPt }
    : { stopPts: si?.stop_pts || 0, stopReais: si?.stop_reais || 0,
        alvoPts: si?.alvo_pts || 0, alvoReais: si?.alvo_reais || 0 }

  function salvarManual() {
    if (!manStop) { alert('Preencha o stop.'); return }
    setMode('man')
    setEditOpen(false)
  }
  function cancelarManual() {
    setMode('sys'); setManStop(''); setManAlvo(''); setEditOpen(false)
  }

  const manRR = manStop && manAlvo ? (parseInt(manAlvo) / parseInt(manStop)).toFixed(2) : null
  const sysRR = si && si.stop_pts > 0 ? (si.alvo_pts / si.stop_pts).toFixed(2) : null
  const rr = mode === 'man' ? manRR : sysRR

  return (
    <div style={{ background: 'var(--bg2)', border: `2px solid ${semBorder}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
        {/* Ativo WIN/WDO */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {['WIN', 'WDO'].map(i => (
            <button key={i} onClick={() => onInstChange(i)} style={{
              padding: '5px 14px', borderRadius: '6px', fontFamily: 'inherit', fontWeight: 700, fontSize: '13px',
              border: '1px solid', cursor: 'pointer', transition: '.2s',
              background: inst === i ? 'var(--gold-bg)' : 'transparent',
              color: inst === i ? 'var(--gold)' : 'var(--txt3)',
              borderColor: inst === i ? 'var(--gold-bd)' : 'var(--border2)',
            }}>{i}</button>
          ))}
        </div>
        <div style={{ flex: 1, fontSize: '11px', color: 'var(--txt3)' }}>
          {inst === 'WDO' ? 'R$10,00/pt' : 'R$0,20/pt'} · {cts}ct
        </div>
        <div style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', color: m.color, border: `1px solid ${m.color}20`, background: `${m.color}12` }}>
          {m.label}
        </div>
        {mode === 'man' && (
          <div style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', color: 'var(--yellow)', border: '1px solid rgba(255,193,77,.4)', background: 'rgba(255,193,77,.1)', cursor: 'pointer' }}
            onClick={() => setEditOpen(true)}>✎ MANUAL</div>
        )}
        <button onClick={() => setEditOpen(!editOpen)} style={{
          padding: '4px 10px', border: '1px solid var(--border2)', borderRadius: '20px', background: 'none',
          color: editOpen ? 'var(--yellow)' : 'var(--txt3)', fontFamily: 'inherit', fontSize: '11px', fontWeight: 700,
          cursor: 'pointer', borderColor: editOpen ? 'var(--yellow)' : 'var(--border2)',
        }}>✎ Editar</button>
      </div>

      {!editOpen ? (
        <div style={{ display: 'flex', alignItems: 'center', padding: '18px', gap: 0 }}>
          {[
            { lbl: 'Stop',     pts: activeStop.stopPts, reais: -activeStop.stopReais, neg: true },
            { lbl: 'Alvo mín.',pts: activeStop.alvoPts, reais: activeStop.alvoReais,  neg: false },
            { lbl: 'R/R',      rr: rr },
          ].map((item, idx) => (
            <div key={item.lbl} style={{ flex: 1, textAlign: 'center', padding: '0 8px', borderLeft: idx > 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--txt3)', marginBottom: '7px' }}>{item.lbl}</div>
              {item.rr !== undefined ? (
                <>
                  <div style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: '28px', fontWeight: 700,
                    color: item.rr >= 2 ? 'var(--green)' : item.rr >= 1.5 ? 'var(--gold)' : item.rr >= 1 ? 'var(--yellow)' : 'var(--red)',
                  }}>{item.rr ? item.rr + ':1' : '—'}</div>
                  {si?.be_pts ? <div style={{ fontSize: '10px', color: 'var(--txt3)', marginTop: '5px' }}>Move BE após {si.be_pts} pts</div> : null}
                </>
              ) : (
                <>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '28px', fontWeight: 700, color: item.neg ? 'var(--red)' : 'var(--green)' }}>
                    {item.pts ? item.pts + ' pts' : '—'}
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '5px', color: item.neg ? 'var(--red)' : 'var(--green)' }}>
                    {item.pts ? R(item.reais) : '—'}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '16px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
            {[
              { lbl: 'Stop (pts)', val: manStop, set: setManStop, neg: true },
              { lbl: 'Alvo (pts)', val: manAlvo, set: setManAlvo, neg: false },
            ].map(({ lbl, val, set, neg }) => (
              <div key={lbl}>
                <label style={{ fontSize: '10px', color: 'var(--txt3)', display: 'block', marginBottom: '4px' }}>{lbl}</label>
                <input type="number" value={val} onChange={e => set(e.target.value)} placeholder="ex: 200" min="1"
                  style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--txt)', padding: '8px 10px', borderRadius: '7px', fontFamily: "'JetBrains Mono',monospace", fontSize: '16px', fontWeight: 700, outline: 'none' }} />
                <div style={{ fontSize: '11px', marginTop: '4px', color: neg ? 'var(--red)' : 'var(--green)', fontFamily: "'JetBrains Mono',monospace" }}>
                  {val ? (neg ? '−' : '+') + R(parseInt(val) * cts * vlrPt) : '—'}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: 'var(--txt3)', textAlign: 'center', marginBottom: '12px' }}>
            {manRR ? `R/R ${manRR}:1` : '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255,193,77,.06)', borderTop: '1px solid rgba(255,193,77,.2)', borderRadius: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--yellow)' }}>Stop manual — será usado no registro</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={cancelarManual} style={{ padding: '5px 12px', border: '1px solid var(--border2)', borderRadius: '7px', background: 'none', color: 'var(--txt3)', fontFamily: 'inherit', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>✕ Cancelar</button>
              <button onClick={salvarManual} style={{ padding: '5px 16px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: '7px', fontFamily: 'inherit', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>✓ Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Hint */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--txt3)' }}>
        {mode === 'man' && <span style={{ color: 'var(--yellow)', fontSize: '9px', fontWeight: 700, marginRight: '6px' }}>[MANUAL]</span>}
        💡 Stop: <strong style={{ color: 'var(--yellow)' }}>{activeStop.stopPts} pts ({R(activeStop.stopReais)})</strong>
        &nbsp;·&nbsp; Alvo: <strong style={{ color: 'var(--green)' }}>{activeStop.alvoPts} pts ({R(activeStop.alvoReais)})</strong>
      </div>
    </div>
  )
}

// ── Checklist Card ────────────────────────────────────────────────────────────
function ChecklistCard({ lado, items, onScore, onAbrir }) {
  const [checked, setChecked] = useState([])
  const total = items.filter(i => i.ativo != 0).length || 1
  const ativos = items.filter(i => i.ativo != 0)
  const score = checked.length
  const pct   = total > 0 ? (score / total) * 100 : 0
  const ok    = total > 0 && score === total
  const isC   = lado === 'COMPRA'
  const cor   = isC ? 'var(--green)' : 'var(--red)'

  useEffect(() => { setChecked([]); onScore(0, total) }, [items])
  useEffect(() => { onScore(score, total) }, [score, total])

  function toggle(id) {
    setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const tagColor = (tag) => {
    if (!tag) return {}
    if (tag.toUpperCase().includes('VWAP'))  return { background: 'rgba(77,159,255,.15)',  color: '#4d9fff' }
    if (tag.toUpperCase().includes('WEIS'))  return { background: 'rgba(255,193,77,.15)',  color: 'var(--yellow)' }
    return { background: 'rgba(91,106,240,.15)', color: 'var(--gold)' }
  }

  return (
    <div style={{
      background: 'var(--bg2)', border: `2px solid ${ok ? cor : 'var(--border)'}`,
      borderRadius: '14px', overflow: 'hidden', transition: '.3s',
      boxShadow: ok ? `0 0 28px ${cor}18` : 'none',
    }}>
      <div style={{
        padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: isC ? 'linear-gradient(135deg,rgba(0,229,160,.07),transparent)' : 'linear-gradient(135deg,rgba(255,69,96,.07),transparent)',
      }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: cor }}>{isC ? '▲ COMPRA' : '▼ VENDA'}</div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '20px', fontWeight: 700, color: cor }}>{score}/{total}</div>
      </div>

      <div style={{ padding: '10px 18px 0' }}>
        {ativos.length === 0 ? (
          <div style={{ color: 'var(--txt3)', fontSize: '11px', padding: '10px 0' }}>Nenhum critério ativo.</div>
        ) : ativos.map(item => {
          const on = checked.includes(item.id)
          return (
            <div key={item.id} onClick={() => toggle(item.id)} style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '9px 8px',
              borderRadius: '8px', cursor: 'pointer', marginBottom: '2px',
              background: on ? `${cor}08` : 'transparent',
            }}>
              <div style={{
                width: '22px', height: '22px', border: `2px solid ${on ? cor : 'var(--border2)'}`,
                borderRadius: '6px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: on ? cor : 'transparent', transition: '.2s', fontSize: '11px', fontWeight: 900, color: '#000',
              }}>{on ? '✓' : ''}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: on ? 'var(--txt)' : 'var(--txt2)', display: 'block', marginBottom: '2px' }}>{item.titulo}</div>
                {item.descricao && <div style={{ fontSize: '11px', color: 'var(--txt3)', lineHeight: 1.5 }}>{item.descricao}</div>}
              </div>
              {item.tag && (
                <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '3px', fontFamily: "'JetBrains Mono',monospace", flexShrink: 0, marginTop: '2px', ...tagColor(item.tag) }}>{item.tag}</span>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ padding: '14px 18px' }}>
        <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: cor, borderRadius: '2px', transition: 'width .35s' }} />
        </div>
        <div style={{
          fontSize: '10px', textAlign: 'center', marginBottom: '8px',
          color: ok ? cor : score === total - 1 ? 'var(--yellow)' : 'var(--txt3)',
          fontWeight: ok ? 700 : 400,
        }}>
          {ok ? `✅ ${total} de ${total} — PODE ENTRAR` : score === total - 1 ? '⚡ Falta 1 critério' : `${score} de ${total} — todos obrigatórios`}
        </div>
        <button onClick={() => ok && onAbrir(lado)} disabled={!ok} style={{
          width: '100%', padding: '13px', border: 'none', borderRadius: '8px',
          fontFamily: 'inherit', fontSize: '15px', fontWeight: 800, cursor: ok ? 'pointer' : 'not-allowed',
          background: ok ? cor : 'var(--border)', color: ok ? (isC ? '#000' : '#fff') : 'var(--txt3)',
          transition: '.25s',
        }}>
          {isC ? '▲ COMPRAR' : '▼ VENDER'}
        </button>
      </div>
    </div>
  )
}

// ── Registro Panel ────────────────────────────────────────────────────────────
function RegPanel({ tipo, contas, contaId, inst, gestao, onClose, onRegistered }) {
  const [pts, setPts] = useState('')
  const [cts, setCts] = useState('')
  const [ent, setEnt] = useState(() => new Date().toTimeString().slice(0, 5))
  const [sai, setSai] = useState(() => new Date().toTimeString().slice(0, 5))
  const [loading, setLoading] = useState(false)
  const isC = tipo === 'COMPRA'

  const conta = contas.find(c => +c.id === +contaId)
  const ctsDef = inst === 'WDO' ? (+conta?.contratos_wdo || 1) : (+conta?.contratos || 1)
  const ctsEff = parseInt(cts) > 0 ? parseInt(cts) : ctsDef
  const vlrPt  = inst === 'WDO' ? 10.0 : 0.20
  const prev   = pts ? parseInt(pts) * ctsEff * vlrPt : null

  async function registrar() {
    if (!pts) { alert('Preencha os pontos!'); return }
    if (gestao?.semaforo === 'VERMELHO') {
      if (!confirm('🛑 Semáforo VERMELHO — ' + (gestao.motivos?.[0] || '') + '\n\nRegistrar mesmo assim?')) return
    }
    setLoading(true)
    try {
      const token = localStorage.getItem('ts_token')
      const res = await fetch(API('operacoes'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'registrar', conta_id: contaId, tipo,
          pontos: parseInt(pts), resultado: prev,
          horario_entrada: ent, horario_saida: sai,
          instrumento: inst,
          ...(parseInt(cts) > 0 ? { contratos_real: parseInt(cts) } : {}),
          observacao: `[${tipo}][${inst}] Semáforo: ${gestao?.semaforo || '?'}`,
        }),
      })
      const d = await res.json()
      if (d.ok) { onRegistered(); onClose() }
      else alert(d.erro || 'Erro ao registrar')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginTop: '4px' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: isC ? 'var(--green)' : 'var(--red)' }}>📝 Registrar {tipo}</span>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border2)', color: 'var(--txt3)', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit' }}>✕ Fechar</button>
      </div>

      {gestao?.semaforo === 'VERMELHO' && (
        <div style={{ margin: '12px 18px 0', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,69,96,.08)', border: '1px solid rgba(255,69,96,.3)', color: 'var(--red)' }}>
          🛑 {gestao.motivos?.[0]} — Você ainda pode registrar.
        </div>
      )}
      {gestao?.semaforo === 'AMARELO' && (
        <div style={{ margin: '12px 18px 0', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,193,77,.08)', border: '1px solid rgba(255,193,77,.3)', color: 'var(--yellow)' }}>
          ⚠️ {gestao.motivos?.[0]}
        </div>
      )}

      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
          {[
            { lbl: 'Pontos (+ gain / − loss)', val: pts, set: setPts, type: 'number', placeholder: 'ex: 250 ou -200' },
            { lbl: `Lote (cts) — padrão ${ctsDef}ct`, val: cts, set: setCts, type: 'number', placeholder: `${ctsDef}` },
            { lbl: 'Entrada', val: ent, set: setEnt, type: 'time' },
            { lbl: 'Saída',   val: sai, set: setSai, type: 'time' },
          ].map(({ lbl, val, set, type, placeholder }) => (
            <div key={lbl} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '9px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '1px' }}>{lbl}</label>
              <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={placeholder || ''}
                style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--txt)', padding: '8px 10px', borderRadius: '6px', fontFamily: 'inherit', fontSize: '12px', outline: 'none', width: '100%' }} />
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '9px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Prévia</label>
            <div style={{
              fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', textAlign: 'center', padding: '9px',
              borderRadius: '6px', background: 'var(--bg3)', border: `1px solid ${prev == null ? 'var(--border2)' : prev >= 0 ? 'rgba(0,229,160,.2)' : 'rgba(255,69,96,.2)'}`,
              color: prev == null ? 'var(--txt3)' : prev >= 0 ? 'var(--green)' : 'var(--red)',
            }}>
              {prev != null ? `[${inst} ${ctsEff}ct] ${(parseInt(pts) > 0 ? '+' : '')}${pts} = ${R(prev)}` : '—'}
            </div>
          </div>
        </div>
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={registrar} disabled={loading} style={{
            padding: '10px 24px', background: isC ? 'var(--green)' : 'var(--red)', color: isC ? '#000' : '#fff',
            border: 'none', borderRadius: '8px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
          }}>{loading ? 'Registrando...' : 'REGISTRAR'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Operar() {
  const [contas, setContas] = useState([])
  const [contaId, setContaId] = useState(null)
  const [gestao, setGestao] = useState(null)
  const [gestaoLoading, setGestaoLoading] = useState(false)
  const [checklist, setChecklist] = useState([])
  const [inst, setInst] = useState('WIN')
  const [vies, setVies] = useState('')
  const [regTipo, setRegTipo] = useState(null)
  const [cfgOpen, setCfgOpen] = useState(false)
  const [cfgMsg, setCfgMsg] = useState('')
  const [scoreC, setScoreC] = useState([0, 1])
  const [scoreV, setScoreV] = useState([0, 1])
  const loadingRef = useRef(false)

  // Config form
  const [cfgCtsWin, setCfgCtsWin] = useState(1)
  const [cfgCtsWdo, setCfgCtsWdo] = useState(1)
  const [cfgStopWin, setCfgStopWin] = useState(200)
  const [cfgStopWdo, setCfgStopWdo] = useState(100)
  const [cfgMaxOps, setCfgMaxOps] = useState(5)
  const [cfgJanela, setCfgJanela] = useState('manha')
  const [cfgJanelaIni, setCfgJanelaIni] = useState('09:00')
  const [cfgJanelaFim, setCfgJanelaFim] = useState('11:30')
  const [cfgSemaforo, setCfgSemaforo] = useState(true)
  const [cfgModoConservador, setCfgModoConservador] = useState(false)

  const token = localStorage.getItem('ts_token')
  const headers = { Authorization: `Bearer ${token}` }

  async function loadContas() {
    const r = await fetch(API('contas'), { headers })
    const d = await r.json()
    if (Array.isArray(d)) {
      const ativas = d.filter(c => c.ativa != 0)
      setContas(ativas)
      if (!contaId && ativas.length) setContaId(ativas[0].id)
    }
  }

  async function loadGestao(cId, i) {
    if (loadingRef.current) return
    loadingRef.current = true
    setGestaoLoading(true)
    try {
      const r = await fetch(API(`operar?action=gestao&conta_id=${cId}&instrumento=${i}`), { headers })
      const d = await r.json()
      if (d && d.semaforo) {
        setGestao(d)
      } else {
        // fallback para não travar a UI mesmo com erro da API
        setGestao({ semaforo: 'LIVRE', motivos: [d?.message || 'Erro ao carregar'], ops_hoje: 0, max_ops: 5, res_dia: 0, stop_disponivel: null, stop_dia: 0, meta_dia: 0, ops_restantes: 5, pct_ciclo: 0, dentro_janela: true, semaforo_ativo: false, modo_atual: 'normal', win_si: { cts_sug: 1, stop_pts: 200, stop_reais: 40, alvo_pts: 400, alvo_reais: 80, be_pts: 100 }, wdo_si: { cts_sug: 1, stop_pts: 100, stop_reais: 1000, alvo_pts: 200, alvo_reais: 2000, be_pts: 50 } })
      }
    } catch (e) {
      console.error('loadGestao:', e)
    } finally {
      loadingRef.current = false
      setGestaoLoading(false)
    }
  }

  async function loadChecklist(cId) {
    const r = await fetch(API(`operar?action=checklist&conta_id=${cId}`), { headers })
    const d = await r.json()
    setChecklist(Array.isArray(d) ? d : [])
  }

  useEffect(() => { loadContas() }, [])

  useEffect(() => {
    if (!contaId) return
    loadGestao(contaId, inst)
    loadChecklist(contaId)
    const conta = contas.find(c => +c.id === +contaId)
    if (conta) {
      setCfgCtsWin(conta.contratos || 1)
      setCfgCtsWdo(conta.contratos_wdo || 1)
      setCfgStopWin(conta.stop_pts_win || 200)
      setCfgStopWdo(conta.stop_pts_wdo || 100)
      setCfgMaxOps(conta.max_operacoes_dia || 5)
      setCfgJanela(conta.janela_tipo || 'manha')
      setCfgJanelaIni(String(conta.janela_inicio || '09:00').slice(0, 5))
      setCfgJanelaFim(String(conta.janela_fim || '11:30').slice(0, 5))
      setCfgSemaforo(conta.semaforo_ativo != 0)
      setCfgModoConservador(conta.modo_conservador != 0)
    }
  }, [contaId, contas])

  useEffect(() => {
    if (!contaId) return
    loadGestao(contaId, inst)
  }, [inst])

  // Poll a cada 20s
  useEffect(() => {
    if (!contaId) return
    const t = setInterval(() => loadGestao(contaId, inst), 20000)
    return () => clearInterval(t)
  }, [contaId, inst])

  async function ativarOperar() {
    const r = await fetch(API('operar'), {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'salvar_operar_config', conta_id: contaId,
        operar_ativo: 1, semaforo_ativo: 1, contratos: 1, contratos_modo_seguro: 1,
        contratos_wdo: 1, max_operacoes_dia: 5, stop_pts_win: 200, stop_pts_wdo: 100,
        modo_conservador: 0, janela_tipo: 'manha', janela_inicio: '09:00', janela_fim: '11:30',
      }),
    })
    const d = await r.json()
    if (d.ok) {
      await loadContas()
      loadingRef.current = false  // garante que loadGestao não fica bloqueado
      loadGestao(contaId, inst)
      loadChecklist(contaId)
    }
  }

  async function salvarCfg() {
    const r = await fetch(API('operar'), {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'salvar_operar_config', conta_id: contaId, operar_ativo: 1,
        semaforo_ativo: cfgSemaforo ? 1 : 0,
        contratos: cfgCtsWin, contratos_modo_seguro: Math.max(1, Math.floor(cfgCtsWin / 2)),
        contratos_wdo: cfgCtsWdo, max_operacoes_dia: cfgMaxOps,
        stop_pts_win: cfgStopWin, stop_pts_wdo: cfgStopWdo,
        modo_conservador: cfgModoConservador ? 1 : 0,
        janela_tipo: cfgJanela, janela_inicio: cfgJanelaIni, janela_fim: cfgJanelaFim,
      }),
    })
    const d = await r.json()
    if (d.ok) {
      setCfgMsg('✓ Salvo!')
      loadGestao(contaId, inst)
      loadContas()
      setTimeout(() => setCfgMsg(''), 2000)
    } else setCfgMsg('⚠ ' + (d.erro || 'Erro'))
  }

  async function desativarOperar() {
    if (!confirm('Desativar o controle nesta conta?')) return
    await fetch(API('operar'), {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'salvar_operar_config', conta_id: contaId, operar_ativo: 0, semaforo_ativo: 0, contratos: 1, contratos_modo_seguro: 1, contratos_wdo: 1, max_operacoes_dia: 5, stop_pts_win: 0, stop_pts_wdo: 0, modo_conservador: 0, janela_tipo: 'manha', janela_inicio: '09:00', janela_fim: '11:30' }),
    })
    loadContas()
  }

  const conta = contas.find(c => +c.id === +contaId)
  const operarAtivo = conta?.operar_ativo != 0

  const viesTxts = {
    c: '<strong>Viés: COMPRA</strong> — contexto favorece alta. Priorize setas ▲.',
    v: '<strong>Viés: VENDA</strong> — contexto favorece queda. Priorize setas ▼.',
    n: '<strong>Viés: NEUTRO</strong> — sem direção clara. Só sinais muito confirmados.',
  }

  const ckC = checklist.filter(i => i.lado === 'COMPRA')
  const ckV = checklist.filter(i => i.lado === 'VENDA')

  return (
    <>
      <style>{`
        @keyframes semPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes ldot { 0%,80%,100%{transform:scale(0);opacity:.3} 40%{transform:scale(1);opacity:1} }
        .vies-btn:hover { opacity:.85 }
      `}</style>
      <Nav janelaBadge={gestao} />
      <main style={{ padding: '20px 24px', maxWidth: '900px', margin: '0 auto' }}>

        {/* Conta tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {contas.map(c => (
            <button key={c.id} onClick={() => { setContaId(c.id); setRegTipo(null) }} style={{
              padding: '7px 16px', borderRadius: '8px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: '.2s',
              background: +contaId === +c.id ? 'var(--gold-bg)' : 'var(--bg2)',
              color: +contaId === +c.id ? 'var(--gold)' : 'var(--txt2)',
              border: `1px solid ${+contaId === +c.id ? 'var(--gold-bd)' : 'var(--border2)'}`,
            }}>{c.nome}</button>
          ))}
        </div>

        {/* Sem contas */}
        {contas.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px 24px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'14px' }}>
            <div style={{ fontSize:'32px', marginBottom:'12px' }}>📂</div>
            <div style={{ fontSize:'16px', fontWeight:800, marginBottom:'8px' }}>Nenhuma conta encontrada</div>
            <div style={{ fontSize:'13px', color:'var(--txt3)', lineHeight:1.6 }}>Crie uma conta na aba <strong style={{color:'var(--gold)'}}>Config</strong> para começar.</div>
          </div>
        )}

        {/* Loading gestao */}
        {contas.length > 0 && operarAtivo && gestaoLoading && !gestao && (
          <div style={{ textAlign:'center', padding:'48px', color:'var(--txt3)', fontSize:'13px' }}>
            <div style={{ display:'flex', justifyContent:'center', gap:'6px', marginBottom:'12px' }}>
              {[0,1,2].map(i => <div key={i} style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--gold)', animation:`ldot .8s infinite ${i*.15}s` }} />)}
            </div>
            Carregando controle de operações...
          </div>
        )}

        {/* Controle desativado */}
        {contas.length > 0 && !operarAtivo && (
          <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
            <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '8px' }}>Controle de operações desativado</div>
            <div style={{ fontSize: '13px', color: 'var(--txt3)', marginBottom: '24px', lineHeight: 1.6 }}>Ative para usar o semáforo, calculadora e checklist nesta conta.</div>
            <button onClick={ativarOperar} style={{ padding: '12px 32px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: '8px', fontFamily: 'inherit', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>⚡ ATIVAR CONTROLE</button>
          </div>
        )}

        {contas.length > 0 && operarAtivo && gestao && (
          <>
            {/* Cockpit */}
            <Cockpit g={gestao} />

            {/* Viés */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '11px 16px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--txt3)', fontWeight: 700 }}>Viés</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { v: 'c', label: '▲ Compra', color: 'var(--green)' },
                    { v: 'n', label: '◆ Neutro', color: 'var(--gold)' },
                    { v: 'v', label: '▼ Venda',  color: 'var(--red)' },
                  ].map(({ v, label, color }) => (
                    <button key={v} className="vies-btn" onClick={() => setVies(vies === v ? '' : v)} style={{
                      padding: '6px 16px', borderRadius: '6px', fontFamily: 'inherit', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: '.2s',
                      background: vies === v ? `${color}18` : 'transparent',
                      color: vies === v ? color : 'var(--txt2)',
                      border: `1px solid ${vies === v ? color : 'var(--border2)'}`,
                    }}>{label}</button>
                  ))}
                </div>
              </div>
              {vies && (
                <div style={{ fontSize: '11px', color: 'var(--txt2)', flex: 1, minWidth: '120px' }}
                  dangerouslySetInnerHTML={{ __html: viesTxts[vies] || '' }} />
              )}
            </div>

            {/* Calculadora */}
            <Calculadora g={gestao} inst={inst} onInstChange={setInst} />

            {/* Alerta visual */}
            {gestao.semaforo === 'VERMELHO' && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,69,96,.08)', border: '1px solid rgba(255,69,96,.3)', color: 'var(--red)' }}>
                🛑 {gestao.motivos?.[0]}
              </div>
            )}
            {gestao.semaforo === 'AMARELO' && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,193,77,.08)', border: '1px solid rgba(255,193,77,.3)', color: 'var(--yellow)' }}>
                ⚠️ {gestao.motivos?.[0]}
              </div>
            )}

            {/* Checklist */}
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Checklist de Entrada
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <ChecklistCard lado="COMPRA" items={ckC} onScore={(s, t) => setScoreC([s, t])} onAbrir={setRegTipo} />
              <ChecklistCard lado="VENDA"  items={ckV} onScore={(s, t) => setScoreV([s, t])} onAbrir={setRegTipo} />
            </div>

            {/* Registro */}
            {regTipo && (
              <RegPanel
                tipo={regTipo} contas={contas} contaId={contaId} inst={inst} gestao={gestao}
                onClose={() => setRegTipo(null)}
                onRegistered={() => { loadGestao(contaId, inst); setRegTipo(null) }}
              />
            )}

            {/* Config */}
            <div style={{ marginTop: '18px' }}>
              <button onClick={() => setCfgOpen(!cfgOpen)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: cfgOpen ? '8px 8px 0 0' : '8px', color: 'var(--txt3)', fontFamily: 'inherit',
                fontSize: '11px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px',
              }}>
                <span>⚙ Configurações do controle</span>
                <span>{cfgOpen ? '▼' : '▶'}</span>
              </button>
              {cfgOpen && (
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    {[
                      { lbl: 'Contratos WIN',   val: cfgCtsWin,  set: setCfgCtsWin },
                      { lbl: 'Contratos WDO',   val: cfgCtsWdo,  set: setCfgCtsWdo },
                      { lbl: 'Stop/op WIN (pts)',val: cfgStopWin, set: setCfgStopWin },
                      { lbl: 'Stop/op WDO (pts)',val: cfgStopWdo, set: setCfgStopWdo },
                      { lbl: 'Máx. Ops/Dia',    val: cfgMaxOps,  set: setCfgMaxOps },
                    ].map(({ lbl, val, set }) => (
                      <div key={lbl}>
                        <label style={{ fontSize: '10px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '4px' }}>{lbl}</label>
                        <input type="number" value={val} onChange={e => set(+e.target.value)} min="0"
                          style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--txt)', padding: '8px 10px', borderRadius: '6px', fontFamily: 'inherit', fontSize: '13px', outline: 'none' }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: '10px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px', display: 'block', marginBottom: '4px' }}>Janela</label>
                      <select value={cfgJanela} onChange={e => setCfgJanela(e.target.value)}
                        style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--txt)', padding: '8px 10px', borderRadius: '6px', fontFamily: 'inherit', fontSize: '13px', outline: 'none' }}>
                        <option value="manha">☀ Manhã (09h–11h30)</option>
                        <option value="tarde">🌅 Tarde (14h–17h)</option>
                        <option value="personalizado">⚙ Personalizado</option>
                      </select>
                    </div>
                  </div>
                  {cfgJanela === 'personalizado' && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--txt3)' }}>De</span>
                      <input type="time" value={cfgJanelaIni} onChange={e => setCfgJanelaIni(e.target.value)}
                        style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--txt)', padding: '6px 8px', borderRadius: '5px', fontSize: '12px' }} />
                      <span style={{ fontSize: '11px', color: 'var(--txt3)' }}>até</span>
                      <input type="time" value={cfgJanelaFim} onChange={e => setCfgJanelaFim(e.target.value)}
                        style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--txt)', padding: '6px 8px', borderRadius: '5px', fontSize: '12px' }} />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {[
                      { lbl: 'Semáforo ativo', val: cfgSemaforo, set: setCfgSemaforo, color: 'var(--green)' },
                      { lbl: 'Modo conservador', val: cfgModoConservador, set: setCfgModoConservador, color: 'var(--yellow)' },
                    ].map(({ lbl, val, set, color }) => (
                      <label key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ accentColor: color }} />
                        {lbl}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button onClick={salvarCfg} style={{ padding: '9px 20px', background: 'linear-gradient(135deg,var(--gold),var(--gold2))', color: '#0c0c0e', border: 'none', borderRadius: '7px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Salvar</button>
                    {cfgMsg && <span style={{ fontSize: '12px', color: cfgMsg.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{cfgMsg}</span>}
                    <button onClick={desativarOperar} style={{ marginLeft: 'auto', padding: '9px 16px', background: 'none', border: '1px solid var(--red)', borderRadius: '7px', color: 'var(--red)', fontFamily: 'inherit', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Desativar controle</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </>
  )
}
