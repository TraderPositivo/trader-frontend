import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Nav from '../components/Nav'
import { api } from '../lib/api'

function R(v) {
  return 'R$ ' + Math.abs(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

const inp = { background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--txt)', padding:'9px 11px', borderRadius:'7px', fontSize:'13px', outline:'none', width:'100%', fontFamily:'inherit' }
const lbl = { fontSize:'11px', color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginBottom:'4px' }

function parseBRL(str) {
  if (str === '' || str === null || str === undefined) return ''
  const s = String(str).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(s)
  return isNaN(n) ? '' : n
}
function fmtBRL(val) {
  if (val === '' || val === null || val === undefined) return ''
  const n = parseFloat(val)
  if (isNaN(n)) return ''
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function CurrencyInput({ value, onChange, placeholder, style }) {
  const [raw, setRaw] = useState(fmtBRL(value))
  useEffect(() => { setRaw(fmtBRL(value)) }, [value])
  function handleChange(e) {
    // Só permite dígitos e vírgula (remove tudo mais, inclusive ponto — ponto é separador de milhar, não de decimal)
    const filtered = e.target.value.replace(/[^\d,]/g, '')
    setRaw(filtered)
  }
  function handleBlur() {
    const n = parseBRL(raw)
    if (n !== '') { setRaw(fmtBRL(n)); onChange(n) }
    else { setRaw(''); onChange('') }
  }
  return (
    <div style={{ position:'relative' }}>
      <span style={{ position:'absolute', left:'9px', top:'50%', transform:'translateY(-50%)', fontSize:'12px', color:'var(--txt3)', pointerEvents:'none', userSelect:'none' }}>R$</span>
      <input type="text" inputMode="decimal" value={raw}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder || '0,00'}
        style={{ ...style, paddingLeft:'30px' }}
      />
    </div>
  )
}

const API_URL = (path) => `${(import.meta.env.VITE_API_URL || 'https://trader-backend-2v2l.onrender.com')}/api/${path}`

export default function Config() {
  const [searchParams] = useSearchParams()
  const [contas,    setContas]    = useState([])
  const [modal,     setModal]     = useState(null)
  const [cicloMod,  setCicloMod]  = useState(null)
  const [form,      setForm]      = useState({})
  const [cicloForm, setCicloForm] = useState({})
  const [msg,       setMsg]       = useState('')
  const [tab,       setTab]       = useState('conta')

  // Checklist state
  const [ckItems,   setCkItems]   = useState([])
  const [ckLoading, setCkLoading] = useState(false)
  const [ckNovoC,   setCkNovoC]   = useState('')
  const [ckNovoV,   setCkNovoV]   = useState('')

  const token = localStorage.getItem('ts_token')
  const headers = { Authorization: `Bearer ${token}` }

  async function load() {
    const data = await api.get('contas')
    setContas(data)
  }

  useEffect(() => { load() }, [])

  function abrirModal(c = null, tipoConta = null) {
    setMsg('')
    setTab('conta')
    setCkItems([])
    setForm(c ? {
      id: c.id, nome: c.nome,
      meta_diaria: c.meta_diaria, stop_diario: c.stop_diario,
      meta_mensal: c.meta_mensal, stop_mensal: c.stop_mensal,
      loss_limit_ciclo: c.loss_limit_ciclo, custo_renovacao: c.custo_renovacao,
      capital_disponivel: c.capital_disponivel || '', risco_pct: c.risco_pct || 1,
      instrumento: c.instrumento || 'WIN', tipo_conta: c.tipo_conta || 'pessoal',
      stop_pts_win: c.stop_pts_win || 200, stop_pts_wdo: c.stop_pts_wdo || 100,
    } : { instrumento: 'WIN', tipo_conta: tipoConta || 'pessoal', risco_pct: 1, stop_pts_win: 200, stop_pts_wdo: 100 })
    setModal(true)
  }

  async function loadChecklist(contaId) {
    if (!contaId) return
    setCkLoading(true)
    try {
      const r = await fetch(API_URL(`operar?action=checklist&conta_id=${contaId}`), { headers })
      const d = await r.json()
      setCkItems(Array.isArray(d) ? d : [])
    } finally { setCkLoading(false) }
  }

  function switchTab(t) {
    setTab(t)
    if (t === 'checklist' && form.id) loadChecklist(form.id)
  }

  async function salvar() {
    try {
      await api.post('contas', { action: 'salvar', ...form })
      setModal(null)
      load()
    } catch (err) { setMsg('⚠ ' + err.message) }
  }

  async function excluir(c) {
    if (!confirm(`Excluir "${c.nome}" e todas as suas operações?`)) return
    await api.post('contas', { action: 'excluir', id: c.id })
    load()
  }

  async function iniciarCiclo() {
    try {
      await api.post('contas', { action: 'iniciar_ciclo', ...cicloForm })
      setCicloMod(null)
      load()
    } catch (err) { alert(err.message) }
  }

  // Checklist ops
  async function ckAdd(lado, titulo) {
    if (!titulo.trim() || !form.id) return
    await fetch(API_URL('operar'), {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'salvar_checklist', conta_id: form.id, lado, titulo: titulo.trim(), descricao: '', tag: '' }),
    })
    if (lado === 'COMPRA') setCkNovoC(''); else setCkNovoV('')
    loadChecklist(form.id)
  }

  async function ckToggle(id) {
    await fetch(API_URL('operar'), {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_checklist', id }),
    })
    loadChecklist(form.id)
  }

  async function ckExcluir(id) {
    await fetch(API_URL('operar'), {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'excluir_checklist', id }),
    })
    loadChecklist(form.id)
  }

  async function ckResetar() {
    if (!confirm('Resetar checklist para os critérios padrão?')) return
    await fetch(API_URL('operar'), {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resetar_checklist', conta_id: form.id }),
    })
    loadChecklist(form.id)
  }

  const f  = (k) => (e)  => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const fc = (k) => (val) => setForm(p => ({ ...p, [k]: val }))

  useEffect(() => {
    const novo = searchParams.get('novo')
    if (novo === 'pessoal' || novo === 'mesa') {
      abrirModal(null, novo)
      window.history.replaceState({}, '', '/config')
    }
  }, [])

  const ckC = ckItems.filter(i => i.lado === 'COMPRA')
  const ckV = ckItems.filter(i => i.lado === 'VENDA')

  return (
    <>
      <Nav />
      <main style={{ padding:'24px', maxWidth:'960px', margin:'0 auto' }}>

        {/* Info box "Como o sistema funciona" */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'20px 24px', marginBottom:'24px' }}>
          <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'var(--txt3)', marginBottom:'14px' }}>Como o sistema funciona</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {[
              { icon:'✅', cor:'var(--green)', titulo:'Você define:', desc:'Meta mensal, Stop mensal, Stop diário, Meta diária, Loss limit do ciclo, Custo de renovação, Plataforma.' },
              { icon:'🤖', cor:'var(--gold)',  titulo:'Sistema calcula:', desc:'Contratos sugeridos (baseado no % do ciclo consumido e sequência de losses). Nunca muda por conta própria — só sugere.' },
              { icon:'⚡', cor:'var(--yellow)', titulo:'Ciclo:', desc:'Período entre um início e o próximo. Ao iniciar um novo ciclo você define o saldo de partida. O sistema rastreia quanto foi consumido do limite e calcula dias restantes.' },
              { icon:'📁', cor:'#aaa',         titulo:'CSV:', desc:'A primeira operação do arquivo importado define automaticamente a data de início do ciclo para aquela conta.' },
            ].map(({ icon, cor, titulo, desc }) => (
              <div key={titulo} style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
                <span style={{ fontSize:'16px', flexShrink:0 }}>{icon}</span>
                <div style={{ fontSize:'12px', color:'var(--txt2)', lineHeight:1.6 }}>
                  <strong style={{ color: cor }}>{titulo}</strong> {desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cabeçalho contas */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
          <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'var(--txt3)' }}>
            CONTAS ({contas.filter(c => c.ativa != 0).length})
          </div>
          <div style={{ flex:1, height:'1px', background:'var(--border)' }} />
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'16px' }}>
          {contas.filter(c => c.ativa != 0).map(c => {
            const isMesa = (c.tipo_conta || 'pessoal') === 'mesa'
            return (
            <div key={c.id} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'2px' }}>
                  <span style={{ fontSize:'15px', fontWeight:800 }}>{c.nome}</span>
                  <span style={{
                    fontSize:'9px', fontWeight:700, padding:'2px 7px', borderRadius:'3px', fontFamily:"'JetBrains Mono',monospace",
                    background: isMesa ? 'rgba(212,168,67,.15)' : 'rgba(91,164,245,.12)',
                    color: isMesa ? 'var(--yellow)' : '#5ba4f5',
                    border: isMesa ? '1px solid rgba(212,168,67,.3)' : '1px solid rgba(91,164,245,.25)',
                  }}>{isMesa ? 'MESA' : 'PESSOAL'}</span>
                </div>
                <div style={{ display:'flex', gap:'16px', marginTop:'6px', flexWrap:'wrap' }}>
                  {[
                    { lbl:'META DIA',  val: R(c.meta_diaria),      col:'var(--green)' },
                    { lbl:'STOP DIA',  val: R(c.stop_diario),       col:'var(--red)'   },
                    { lbl:'META MÊS',  val: R(c.meta_mensal),       col:'var(--green)' },
                    { lbl:'STOP MÊS',  val: R(c.stop_mensal),       col:'var(--red)'   },
                    { lbl:'CAPITAL',   val: c.capital_disponivel ? R(c.capital_disponivel) : '—', col:'var(--txt2)' },
                  ].map(({ lbl, val, col }) => (
                    <div key={lbl}>
                      <div style={{ fontSize:'8px', color:'var(--txt3)', letterSpacing:'1px' }}>{lbl}</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'13px', fontWeight:700, color:col }}>{val}</div>
                    </div>
                  ))}
                </div>
                {/* Ciclo hint */}
                <div style={{ marginTop:'8px', fontSize:'11px', color:'var(--txt3)' }}>
                  {isMesa
                    ? <span style={{ color:'var(--yellow)' }}>Mesa: ciclo obrigatório — define o período de avaliação da banca.</span>
                    : <span>Pessoal: ciclo = mês corrente por padrão · <span style={{ color:'var(--gold)', cursor:'pointer', fontWeight:600 }}
                        onClick={() => { setCicloMod({ conta_id: c.id, nome: c.nome, pessoal: true }); setCicloForm({ conta_id: c.id, data_inicio: new Date().toISOString().slice(0,10), saldo_inicio: 0 }) }}>
                        definir período personalizado
                      </span></span>
                  }
                </div>
              </div>
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                {isMesa && (
                  <button onClick={() => { setCicloMod({ conta_id: c.id, nome: c.nome }); setCicloForm({ conta_id: c.id, data_inicio: new Date().toISOString().slice(0,10), saldo_inicio: 0 }) }}
                    style={{ padding:'7px 12px', background:'rgba(212,168,67,.12)', border:'1px solid rgba(212,168,67,.3)', color:'var(--yellow)', borderRadius:'6px', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>
                    ⚡ Novo Ciclo
                  </button>
                )}
                <button onClick={() => abrirModal(c)} style={{ padding:'7px 14px', background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--txt2)', borderRadius:'6px', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>
                  ✏ Editar
                </button>
                <button onClick={() => excluir(c)} style={{ padding:'7px 12px', background:'rgba(255,69,96,.08)', border:'1px solid rgba(255,69,96,.2)', color:'var(--red)', borderRadius:'6px', fontSize:'11px', cursor:'pointer' }}>
                  ✕
                </button>
              </div>
            </div>
          )})}
        </div>

        <button onClick={() => abrirModal()} style={{
          width:'100%', padding:'14px', background:'transparent', border:'2px dashed var(--border2)',
          color:'var(--txt3)', borderRadius:'12px', fontSize:'13px', fontWeight:700, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
          transition:'all .2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--gold)'; e.currentTarget.style.color='var(--gold)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border2)'; e.currentTarget.style.color='var(--txt3)' }}>
          + Nova Conta
        </button>
      </main>

      {/* ── Modal conta ───────────────────────────────────────────── */}
      {modal && (
        <div onClick={e => e.target === e.currentTarget && setModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', padding:'20px' }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'16px', width:'100%', maxWidth:'580px', maxHeight:'92vh', display:'flex', flexDirection:'column' }}>
            {/* Header */}
            <div style={{ padding:'20px 24px 0', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
              <span style={{ fontSize:'17px', fontWeight:800 }}>{form.id ? 'Editar Conta' : 'Nova Conta'}</span>
              <button onClick={() => setModal(null)} style={{ background:'none', border:'none', color:'var(--txt3)', fontSize:'20px', cursor:'pointer', padding:'4px 8px' }}>✕</button>
            </div>

            {/* Tabs */}
            {form.id && (
              <div style={{ display:'flex', gap:'4px', padding:'14px 24px 0', flexShrink:0 }}>
                {[
                  { key:'conta',     label:'💰 Conta' },
                  { key:'checklist', label:'✓ Checklist' },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => switchTab(key)} style={{
                    padding:'7px 18px', borderRadius:'7px 7px 0 0', border:'1px solid', fontSize:'12px', fontWeight:700, cursor:'pointer', transition:'.15s',
                    background: tab === key ? 'var(--bg3)' : 'transparent',
                    color: tab === key ? 'var(--gold)' : 'var(--txt3)',
                    borderColor: tab === key ? 'var(--gold-bd)' : 'transparent',
                    borderBottom: tab === key ? '1px solid var(--bg3)' : '1px solid var(--border2)',
                  }}>{label}</button>
                ))}
                <div style={{ flex:1, borderBottom:'1px solid var(--border2)' }} />
              </div>
            )}

            {/* Scrollable body */}
            <div style={{ flex:1, overflowY:'auto', padding:'20px 24px 24px' }}>

              {/* Tab: Conta */}
              {tab === 'conta' && (
                <div key={form.id || 'new'} style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

                  {/* Tipo de conta */}
                  <div>
                    <label style={lbl}>Tipo de Conta</label>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'8px' }}>
                      {[
                        { val:'pessoal', icon:'👤', label:'Pessoal', desc:'Capital próprio, sem regras externas.', cor:'#5ba4f5', corBg:'rgba(91,164,245,.08)', corBd:'rgba(91,164,245,.3)' },
                        { val:'mesa',    icon:'🏢', label:'Mesa Proprietária', desc:'Capital da mesa com ciclo e drawdown.', cor:'var(--yellow)', corBg:'rgba(212,168,67,.08)', corBd:'rgba(212,168,67,.3)' },
                      ].map(({ val, icon, label, desc, cor, corBg, corBd }) => {
                        const sel = (form.tipo_conta || 'pessoal') === val
                        return (
                          <button key={val} type="button" onClick={() => setForm(p => ({ ...p, tipo_conta: val }))} style={{
                            padding:'10px 12px', borderRadius:'8px', border:`1px solid ${sel ? corBd : 'var(--border2)'}`,
                            background: sel ? corBg : 'var(--bg3)', color: sel ? cor : 'var(--txt3)',
                            fontFamily:'inherit', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'flex-start', gap:'2px', transition:'.15s', textAlign:'left',
                          }}>
                            <span style={{ fontSize:'12px', fontWeight:700 }}>{icon} {label}</span>
                            <span style={{ fontSize:'10px', color:'var(--txt3)', fontWeight:400 }}>{desc}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Nome */}
                  <div>
                    <label style={lbl}>Nome da Conta</label>
                    <input style={inp} value={form.nome||''} onChange={f('nome')} placeholder="ex: WIN Pessoal, Mesa XP..." />
                    <p style={{ margin:'4px 0 0', fontSize:'11px', color:'var(--txt3)' }}>Um nome para identificar esta conta no sistema.</p>
                  </div>

                  {/* Metas e Stops */}
                  <div>
                    <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'2px', color:'var(--txt3)', textTransform:'uppercase', marginBottom:'10px' }}>Limites Diários e Mensais</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                      <div>
                        <label style={lbl}>Meta Diária</label>
                        <CurrencyInput style={inp} value={form.meta_diaria||''} onChange={fc('meta_diaria')} />
                        <p style={{ margin:'4px 0 0', fontSize:'11px', color:'var(--txt3)' }}>Quanto quer ganhar por dia. Ao bater, o sistema avisa para encerrar.</p>
                      </div>
                      <div>
                        <label style={{ ...lbl, color:'var(--red)' }}>Stop Diário</label>
                        <CurrencyInput style={inp} value={form.stop_diario||''} onChange={fc('stop_diario')} />
                        <p style={{ margin:'4px 0 0', fontSize:'11px', color:'var(--txt3)' }}>Perda máxima no dia. Ao atingir, PARE de operar.</p>
                      </div>
                      <div>
                        <label style={lbl}>Meta Mensal</label>
                        <CurrencyInput style={inp} value={form.meta_mensal||''} onChange={fc('meta_mensal')} />
                        <p style={{ margin:'4px 0 0', fontSize:'11px', color:'var(--txt3)' }}>Objetivo de lucro no mês. Usado na barra de progresso.</p>
                      </div>
                      <div>
                        <label style={{ ...lbl, color:'var(--red)' }}>Stop Mensal</label>
                        <CurrencyInput style={inp} value={form.stop_mensal||''} onChange={fc('stop_mensal')} />
                        <p style={{ margin:'4px 0 0', fontSize:'11px', color:'var(--txt3)' }}>Perda máxima no mês. Ao atingir, encerre o mês.</p>
                      </div>
                    </div>
                  </div>

                  {/* Regras da Mesa — só aparece quando mesa */}
                  {(form.tipo_conta || 'pessoal') === 'mesa' && (
                    <div style={{ padding:'14px', borderRadius:'10px', background:'rgba(212,168,67,.06)', border:'1px solid rgba(212,168,67,.2)' }}>
                      <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'2px', color:'var(--yellow)', textTransform:'uppercase', marginBottom:'12px' }}>Regras da Mesa</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                        <div>
                          <label style={{ ...lbl, color:'var(--yellow)' }}>Loss Limit do Ciclo</label>
                          <CurrencyInput style={inp} value={form.loss_limit_ciclo||''} onChange={fc('loss_limit_ciclo')} />
                          <p style={{ margin:'4px 0 0', fontSize:'11px', color:'var(--txt3)' }}>Limite total de perda no ciclo definido pela mesa. Ao atingir, o ciclo encerra e é preciso renovar.</p>
                        </div>
                        <div>
                          <label style={{ ...lbl, color:'var(--yellow)' }}>Custo de Renovação</label>
                          <CurrencyInput style={inp} value={form.custo_renovacao||''} onChange={fc('custo_renovacao')} />
                          <p style={{ margin:'4px 0 0', fontSize:'11px', color:'var(--txt3)' }}>Valor pago à mesa para iniciar um novo ciclo. Usado no cálculo de ROI real.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gestão de Capital */}
                  <div style={{ borderTop:'1px solid var(--border)', paddingTop:'16px' }}>
                    <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'2px', color:'var(--txt3)', textTransform:'uppercase', marginBottom:'12px' }}>Gestão de Capital</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                      <div>
                        <label style={lbl}>Capital Disponível</label>
                        <CurrencyInput style={inp} value={form.capital_disponivel||''} onChange={fc('capital_disponivel')} placeholder="0,00" />
                        <p style={{ margin:'4px 0 0', fontSize:'11px', color:'var(--txt3)' }}>Total na conta de trading. Base para calcular o risco por operação.</p>
                      </div>
                      <div>
                        <label style={lbl}>Risco por Operação (%)</label>
                        <input style={inp} type="number" step="0.1" value={form.risco_pct||''} onChange={f('risco_pct')} placeholder="1" />
                        <p style={{ margin:'4px 0 0', fontSize:'11px', color:'var(--txt3)' }}>
                          % do capital que você aceita perder por trade.{form.capital_disponivel && form.risco_pct ? <> Ex: <strong style={{ color:'var(--gold)' }}>R$ {((parseFloat(form.capital_disponivel)||0) * (parseFloat(form.risco_pct)||0) / 100).toLocaleString('pt-BR',{minimumFractionDigits:2})}</strong> por operação.</> : ' Recomendado: 1%.'}
                        </p>
                      </div>
                      <div style={{ gridColumn:'1/-1' }}>
                        <label style={lbl}>Instrumento</label>
                        <select style={inp} value={form.instrumento||'WIN'} onChange={f('instrumento')}>
                          <option value="WIN">WIN — Mini Índice (R$ 0,20/ponto)</option>
                          <option value="WDO">WDO — Mini Dólar (R$ 10,00/ponto)</option>
                          <option value="AMBOS">WIN + WDO (opera os dois)</option>
                        </select>
                      </div>
                      {(form.instrumento === 'WIN' || form.instrumento === 'AMBOS') && (
                        <div>
                          <label style={lbl}>Stop padrão WIN (pontos)</label>
                          <input style={inp} type="number" value={form.stop_pts_win||''} onChange={f('stop_pts_win')} placeholder="200" />
                          <p style={{ margin:'4px 0 0', fontSize:'11px', color:'var(--txt3)' }}>Distância típica do seu stop loss no gráfico. Usado para calcular quantos contratos operar. Ex: 200pts = R$ 40/ct.</p>
                        </div>
                      )}
                      {(form.instrumento === 'WDO' || form.instrumento === 'AMBOS') && (
                        <div>
                          <label style={lbl}>Stop padrão WDO (pontos)</label>
                          <input style={inp} type="number" value={form.stop_pts_wdo||''} onChange={f('stop_pts_wdo')} placeholder="10" />
                          <p style={{ margin:'4px 0 0', fontSize:'11px', color:'var(--txt3)' }}>Distância típica do seu stop loss no gráfico. Ex: 10pts = R$ 100/ct.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {msg && <p style={{ color:'var(--red)', fontSize:'13px' }}>{msg}</p>}
                  <button onClick={salvar} style={{ width:'100%', padding:'12px', background:'linear-gradient(135deg,var(--gold),var(--gold2))', color:'#0c0c0e', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:800, cursor:'pointer' }}>
                    SALVAR
                  </button>
                </div>
              )}

              {/* Tab: Checklist */}
              {tab === 'checklist' && (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                    <div style={{ fontSize:'12px', color:'var(--txt3)' }}>
                      Configure os critérios obrigatórios antes de entrar em cada operação.
                    </div>
                    <button onClick={ckResetar} style={{ padding:'6px 12px', border:'1px solid var(--border2)', borderRadius:'6px', background:'none', color:'var(--txt3)', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>
                      ↺ Resetar padrão
                    </button>
                  </div>

                  {ckLoading ? (
                    <div style={{ textAlign:'center', padding:'32px', color:'var(--txt3)' }}>Carregando...</div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                      {[
                        { lado:'COMPRA', items: ckC, cor:'var(--green)', icone:'▲', novo: ckNovoC, setNovo: setCkNovoC },
                        { lado:'VENDA',  items: ckV, cor:'var(--red)',   icone:'▼', novo: ckNovoV, setNovo: setCkNovoV },
                      ].map(({ lado, items, cor, icone, novo, setNovo }) => (
                        <div key={lado}>
                          <div style={{ fontSize:'12px', fontWeight:800, color:cor, marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px' }}>
                            {icone} {lado}
                            <span style={{ marginLeft:'auto', fontSize:'10px', color:'var(--txt3)', fontWeight:400 }}>
                              {items.filter(i => i.ativo != 0).length} ativos
                            </span>
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', gap:'4px', marginBottom:'10px' }}>
                            {items.length === 0 && (
                              <div style={{ fontSize:'12px', color:'var(--txt3)', padding:'12px', textAlign:'center', border:'1px dashed var(--border2)', borderRadius:'8px' }}>
                                Nenhum critério
                              </div>
                            )}
                            {items.map(item => (
                              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderRadius:'7px', background:'var(--bg3)', border:'1px solid var(--border)' }}>
                                <div onClick={() => ckToggle(item.id)} style={{
                                  width:'16px', height:'16px', borderRadius:'4px', flexShrink:0, cursor:'pointer',
                                  border:`2px solid ${item.ativo != 0 ? cor : 'var(--border2)'}`,
                                  background: item.ativo != 0 ? cor : 'transparent',
                                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', color:'#000', fontWeight:900,
                                  transition:'.2s',
                                }}>{item.ativo != 0 ? '✓' : ''}</div>
                                <span style={{ flex:1, fontSize:'12px', color: item.ativo != 0 ? 'var(--txt)' : 'var(--txt3)', textDecoration: item.ativo != 0 ? 'none' : 'line-through' }}>
                                  {item.titulo}
                                </span>
                                <button onClick={() => ckExcluir(item.id)} style={{ background:'none', border:'none', color:'var(--txt3)', cursor:'pointer', fontSize:'12px', padding:'2px 4px', borderRadius:'3px' }}
                                  onMouseEnter={e => e.target.style.color='var(--red)'}
                                  onMouseLeave={e => e.target.style.color='var(--txt3)'}>✕</button>
                              </div>
                            ))}
                          </div>
                          <div style={{ display:'flex', gap:'6px' }}>
                            <input
                              value={novo} onChange={e => setNovo(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && ckAdd(lado, novo)}
                              placeholder={`+ Critério ${lado.toLowerCase()}`}
                              style={{ ...inp, flex:1, padding:'7px 10px', fontSize:'12px' }}
                            />
                            <button onClick={() => ckAdd(lado, novo)} style={{
                              padding:'7px 12px', background: cor === 'var(--green)' ? 'rgba(0,229,160,.15)' : 'rgba(255,69,96,.1)',
                              border:`1px solid ${cor}40`, color: cor, borderRadius:'7px', fontWeight:700, fontSize:'12px', cursor:'pointer', flexShrink:0,
                            }}>+ Add</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal ciclo ───────────────────────────────────────────── */}
      {cicloMod && (
        <div onClick={e => e.target === e.currentTarget && setCicloMod(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', padding:'20px' }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'440px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
              <span style={{ fontSize:'17px', fontWeight:800 }}>{cicloMod.pessoal ? '📅' : '⚡'} {cicloMod.pessoal ? 'Período Personalizado' : 'Iniciar Ciclo'} — {cicloMod.nome}</span>
              <button onClick={() => setCicloMod(null)} style={{ background:'none', border:'none', color:'var(--txt3)', fontSize:'20px', cursor:'pointer' }}>✕</button>
            </div>

            {/* Explicação contextual */}
            {cicloMod.pessoal ? (
              <div style={{ padding:'12px 14px', background:'rgba(91,164,245,.08)', border:'1px solid rgba(91,164,245,.2)', borderRadius:'8px', marginBottom:'16px', fontSize:'12px', color:'var(--txt2)', lineHeight:1.7 }}>
                <strong style={{ color:'#5ba4f5' }}>Conta Pessoal</strong> — por padrão o ciclo é o mês corrente.
                Defina aqui um período diferente se quiser acompanhar um intervalo específico (ex: início de uma nova fase, meta de 3 meses etc.).
                O histórico não é apagado, só o ponto de contagem muda.
              </div>
            ) : (
              <div style={{ padding:'12px 14px', background:'rgba(212,168,67,.08)', border:'1px solid rgba(212,168,67,.25)', borderRadius:'8px', marginBottom:'16px', fontSize:'12px', color:'var(--txt2)', lineHeight:1.7 }}>
                <strong style={{ color:'var(--yellow)' }}>Conta Mesa</strong> — o ciclo define o período oficial de avaliação da banca.
                O saldo de partida é o resultado acumulado ao início do ciclo (geralmente 0 no início, ou negativo se veio de um drawdown anterior).
                Loss limit e progresso são calculados a partir desta data.
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
              <div><label style={lbl}>Data de Início</label><input style={inp} type="date" value={cicloForm.data_inicio||''} onChange={e => setCicloForm(p => ({...p, data_inicio: e.target.value}))} /></div>
              <div><label style={lbl}>Saldo de Partida</label><CurrencyInput style={inp} value={cicloForm.saldo_inicio||''} onChange={val => setCicloForm(p => ({...p, saldo_inicio: val}))} placeholder="0,00" /></div>
            </div>
            <p style={{ fontSize:'11px', color:'var(--txt3)', borderTop:'1px solid var(--border)', paddingTop:'12px', marginBottom:'16px', lineHeight:1.6 }}>
              O histórico anterior é mantido. O cálculo do ciclo passa a contar desta data.
            </p>
            <button onClick={iniciarCiclo} style={{ width:'100%', padding:'12px', background: cicloMod.pessoal ? '#5ba4f5' : 'var(--green)', color:'#000', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:800, cursor:'pointer' }}>
              {cicloMod.pessoal ? '📅 DEFINIR PERÍODO' : '⚡ INICIAR CICLO'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
