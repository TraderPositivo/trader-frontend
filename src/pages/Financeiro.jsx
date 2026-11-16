import { useState, useEffect, useCallback, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import Nav from '../components/Nav'
import { api } from '../lib/api'

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

// ── helpers ────────────────────────────────────────────────────────────────────
function R(v) {
  const abs = Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (v < 0 ? '-' : '') + 'R$ ' + abs
}
function mesLabel(mes) {
  if (!mes) return ''
  const [y, m] = mes.split('-')
  const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${nomes[parseInt(m) - 1]}/${String(y).slice(2)}`
}
function dtBR(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
function uid() { return Math.random().toString(36).slice(2) }

async function extractTextFromPDF(file) {
  const ab  = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map(it => it.str).join(' ') + '\n'
  }
  return text
}

const inp = { width: '100%', padding: '8px 10px', borderRadius: '7px', fontSize: '13px', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--txt)', outline: 'none', fontFamily: 'inherit' }
const lbl = { fontSize: '10px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: '4px' }

const STATUS = {
  pendente: { label: 'Pendente', cor: '#e05c6a', bg: 'rgba(224,92,106,.1)',   bd: 'rgba(224,92,106,.25)' },
  pago:     { label: 'Pago',     cor: '#4caf82', bg: 'rgba(76,175,130,.1)',   bd: 'rgba(76,175,130,.25)' },
  isento:   { label: 'Isento',   cor: '#8888a0', bg: 'rgba(136,136,160,.08)', bd: 'rgba(136,136,160,.2)' },
  prejuizo: { label: 'Prejuízo', cor: '#d4a843', bg: 'rgba(212,168,67,.08)', bd: 'rgba(212,168,67,.2)'   },
  diferido: { label: 'Diferido', cor: '#5ba4f5', bg: 'rgba(91,164,245,.08)', bd: 'rgba(91,164,245,.22)'  },
}
function StatusBadge({ s }) {
  const cfg = STATUS[s] || STATUS.isento
  return <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: cfg.bg, border: `1px solid ${cfg.bd}`, color: cfg.cor, fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>{cfg.label}</span>
}

// ── Card de revisão de uma nota ────────────────────────────────────────────────
function NotaCard({ item, contas, onChange, onRemove }) {
  const { filename, status, error, fields, confidence } = item
  const [showRaw, setShowRaw] = useState(false)
  const set = (k, v) => onChange({ ...item, fields: { ...fields, [k]: v } })
  const lucroLiq = (parseFloat(fields.resultado_bruto) || 0) - (parseFloat(fields.custos) || 0)
  const liqCol   = lucroLiq > 0 ? 'var(--green)' : lucroLiq < 0 ? 'var(--red)' : 'var(--txt3)'

  if (status === 'parsing') return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ fontSize: '20px' }}>⏳</div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600 }}>{filename}</div>
        <div style={{ fontSize: '11px', color: 'var(--txt3)' }}>Lendo PDF…</div>
      </div>
    </div>
  )

  if (status === 'saved') return (
    <div style={{ background: 'var(--bg2)', border: '1px solid rgba(76,175,130,.3)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ fontSize: '20px' }}>✅</div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green)' }}>{filename}</div>
        <div style={{ fontSize: '11px', color: 'var(--txt3)' }}>Salvo — {mesLabel(fields.mes_referencia)}</div>
      </div>
    </div>
  )

  if (status === 'error') return (
    <div style={{ background: 'var(--bg2)', border: '1px solid rgba(224,92,106,.3)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '20px' }}>❌</div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600 }}>{filename}</div>
          <div style={{ fontSize: '11px', color: 'var(--red)' }}>{error}</div>
        </div>
      </div>
      <button onClick={onRemove} style={{ background: 'transparent', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
    </div>
  )

  return (
    <div style={{ background: 'var(--bg2)', border: `1px solid ${confidence < 2 ? 'rgba(212,168,67,.4)' : 'var(--border)'}`, borderRadius: '12px', padding: '18px 20px' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt)' }}>{filename}</span>
          <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px',
            background: confidence >= 3 ? 'rgba(76,175,130,.1)' : 'rgba(212,168,67,.1)',
            color: confidence >= 3 ? 'var(--green)' : 'var(--yellow)',
            border: `1px solid ${confidence >= 3 ? 'rgba(76,175,130,.3)' : 'rgba(212,168,67,.3)'}`,
            fontWeight: 700 }}>
            {confidence >= 3 ? `✓ ${confidence}/4 campos` : `⚠ ${confidence}/4 campos`}
          </span>
        </div>
        <button onClick={onRemove} style={{ background: 'transparent', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: '14px' }}>✕</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={lbl}>Data do pregão</label>
          <input style={{ ...inp, borderColor: !fields.data_pregao ? 'rgba(212,168,67,.4)' : 'var(--border2)' }}
            type="date" value={fields.data_pregao || ''} onChange={e => set('data_pregao', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Mês de referência</label>
          <input style={{ ...inp, background: 'var(--bg3)', opacity: .7 }}
            type="month" value={fields.data_pregao ? fields.data_pregao.slice(0,7) : (fields.mes_referencia || '')} readOnly />
        </div>
        <div>
          <label style={lbl}>Conta</label>
          <select style={inp} value={fields.conta_id || ''} onChange={e => set('conta_id', e.target.value)}>
            <option value="">Consolidado (todas)</option>
            {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Resultado bruto day trade (R$)</label>
          <input style={{ ...inp, borderColor: fields.resultado_bruto === '' || fields.resultado_bruto == null ? 'rgba(224,92,106,.5)' : 'var(--border2)' }}
            type="number" step="0.01" placeholder="ex: 2800 ou -500"
            value={fields.resultado_bruto ?? ''} onChange={e => set('resultado_bruto', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Custos — emolumentos + corretagem (R$)</label>
          <input style={{ ...inp, borderColor: fields.custos === '' || fields.custos == null ? 'rgba(224,92,106,.5)' : 'var(--border2)' }}
            type="number" step="0.01" placeholder="ex: 1.50"
            value={fields.custos ?? ''} onChange={e => set('custos', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>IRRF retido 1% (R$)</label>
          <input style={{ ...inp, borderColor: fields.irrf_retido === '' || fields.irrf_retido == null ? 'rgba(212,168,67,.4)' : 'var(--border2)' }}
            type="number" step="0.01" placeholder="ex: 1.14"
            value={fields.irrf_retido ?? ''} onChange={e => set('irrf_retido', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Observação</label>
          <input style={inp} type="text" placeholder="opcional"
            value={fields.observacao || ''} onChange={e => set('observacao', e.target.value)} />
        </div>
      </div>

      {/* preview lucro */}
      <div style={{ marginTop: '10px', padding: '8px 14px', borderRadius: '8px', background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--txt3)' }}>Lucro líquido</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '15px', fontWeight: 700, color: liqCol }}>
          {(fields.resultado_bruto != null && fields.custos != null) ? R(lucroLiq) : '—'}
        </span>
      </div>

      {/* debug: trecho em torno de "ajuste day trade" */}
      {item.debugText && (
        <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '6px', background: 'rgba(91,164,245,.08)', border: '1px solid rgba(91,164,245,.2)', fontSize: '10px', color: 'var(--txt3)', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          <span style={{ color: 'var(--blue)', fontWeight: 700 }}>Debug (texto bruto extraído):</span>{'\n'}{item.debugText}
        </div>
      )}

      {/* raw text toggle */}
      {item.rawText && (
        <div style={{ marginTop: '10px' }}>
          <button onClick={() => setShowRaw(s => !s)} style={{ fontSize: '10px', color: 'var(--txt3)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            {showRaw ? '▲ Ocultar texto extraído' : '▼ Ver texto extraído do PDF (debug)'}
          </button>
          {showRaw && (
            <pre style={{ marginTop: '6px', padding: '10px', borderRadius: '8px', background: 'var(--bg3)', fontSize: '10px', color: 'var(--txt3)', overflowX: 'auto', maxHeight: '200px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {item.rawText.slice(0, 3000)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

// ── Zona de upload + lista de review ──────────────────────────────────────────
function UploadSection({ contas, onSaved }) {
  const [items,   setItems]   = useState([])
  const [saving,  setSaving]  = useState(false)
  const [drag,    setDrag]    = useState(false)
  const fileRef = useRef()

  async function processFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.type === 'application/pdf')
    if (!files.length) return

    // insere placeholders com status 'parsing'
    const newItems = files.map(f => ({ id: uid(), filename: f.name, status: 'parsing', fields: {}, rawText: '', confidence: 0 }))
    setItems(prev => [...prev, ...newItems])

    // processa cada um
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ph   = newItems[i]
      try {
        const text   = await extractTextFromPDF(file)
        const parsed = await api.post('financeiro/parse-pdf', { text })
        setItems(prev => prev.map(it => it.id !== ph.id ? it : {
          ...it,
          status:     'review',
          rawText:    text,
          debugText:  parsed._dbg || '',
          confidence: parsed.confidence,
          fields: {
            mes_referencia:  parsed.mes_referencia  || '',
            data_pregao:     parsed.data_pregao     || '',
            conta_id:        '',
            resultado_bruto: parsed.resultado_bruto != null ? String(parsed.resultado_bruto) : '',
            custos:          parsed.custos          != null ? String(parsed.custos)          : '',
            irrf_retido:     parsed.irrf_retido     != null ? String(parsed.irrf_retido)     : '',
            observacao:      '',
          },
        }))
      } catch (e) {
        setItems(prev => prev.map(it => it.id !== ph.id ? it : { ...it, status: 'error', error: e.message || 'Erro ao processar' }))
      }
    }
  }

  function onDrop(e) { e.preventDefault(); setDrag(false); processFiles(e.dataTransfer.files) }
  function onChange(updated) { setItems(prev => prev.map(it => it.id === updated.id ? updated : it)) }
  function onRemove(id) { setItems(prev => prev.filter(it => it.id !== id)) }

  const pendentes = items.filter(it => it.status === 'review')
  const temErro   = items.some(it => it.status === 'error')

  async function salvarTudo() {
    setSaving(true)
    for (const item of pendentes) {
      const { fields } = item
      try {
        await api.post('financeiro', {
          action:          'salvar',
          mes_referencia:  fields.data_pregao ? fields.data_pregao.slice(0,7) : fields.mes_referencia,
          data_pregao:     fields.data_pregao || null,
          conta_id:        fields.conta_id ? parseInt(fields.conta_id) : null,
          resultado_bruto: parseFloat(fields.resultado_bruto) || 0,
          custos:          parseFloat(fields.custos)          || 0,
          irrf_retido:     parseFloat(fields.irrf_retido)     || 0,
          observacao:      fields.observacao || null,
        })
        setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'saved' } : it))
      } catch (e) {
        setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'error', error: e.message } : it))
      }
    }
    setSaving(false)
    onSaved()
  }

  function limpar() { setItems(prev => prev.filter(it => it.status !== 'saved' && it.status !== 'error')) }

  return (
    <div>
      {/* zona de upload */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${drag ? 'var(--gold)' : 'var(--border2)'}`,
          borderRadius: '14px', padding: '32px 24px', textAlign: 'center', cursor: 'pointer',
          background: drag ? 'var(--gold-bg)' : 'var(--bg2)', transition: 'all .2s',
          marginBottom: items.length ? '16px' : 0,
        }}
      >
        <div style={{ fontSize: '28px', marginBottom: '8px' }}>📄</div>
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>Importar notas de corretagem</div>
        <p style={{ fontSize: '11px', color: 'var(--txt3)', lineHeight: 1.7 }}>
          Arraste um ou mais PDFs aqui, ou clique para selecionar<br />
          <span style={{ opacity: .7 }}>Cada dia de pregão é uma linha separada — re-importar o mesmo dia sobrescreve</span>
        </p>
      </div>
      <input ref={fileRef} type="file" accept="application/pdf" multiple style={{ display: 'none' }} onChange={e => processFiles(e.target.files)} />

      {/* cards de review */}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map(item => (
            <NotaCard key={item.id} item={item} contas={contas}
              onChange={onChange} onRemove={() => onRemove(item.id)} />
          ))}

          {/* barra de ações */}
          {(pendentes.length > 0 || temErro) && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingTop: '4px' }}>
              {pendentes.length > 0 && (
                <button onClick={salvarTudo} disabled={saving}
                  style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#0c0c0e', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', opacity: saving ? .6 : 1 }}>
                  {saving ? 'Salvando…' : `Salvar ${pendentes.length} nota${pendentes.length > 1 ? 's' : ''}`}
                </button>
              )}
              <button onClick={limpar}
                style={{ padding: '11px 18px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border2)', color: 'var(--txt3)', fontSize: '12px', cursor: 'pointer' }}>
                Limpar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Modal pagar DARF ───────────────────────────────────────────────────────────
function ModalPagar({ nota, onSave, onCancel }) {
  const [valor, setValor] = useState(String(nota.darf_calculado))
  const [data,  setData]  = useState(nota.data_pagamento || new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  async function confirmar() {
    setSaving(true)
    try { await api.post('financeiro', { action: 'marcar_pago', id: nota.id, darf_pago: parseFloat(valor) || 0, data_pagamento: data }); onSave() }
    catch { setSaving(false) }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: '380px' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Marcar DARF como pago — {mesLabel(nota.mes_referencia)}</div>
        <div style={{ marginBottom: '12px' }}><label style={lbl}>Valor pago (R$)</label><input style={inp} type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} /></div>
        <div style={{ marginBottom: '16px' }}><label style={lbl}>Data do pagamento</label><input style={inp} type="date" value={data} onChange={e => setData(e.target.value)} /></div>
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--bg3)', border: '1px solid var(--border2)', fontSize: '11px', color: 'var(--txt3)', marginBottom: '16px' }}>
          Código DARF: <strong style={{ color: 'var(--gold)', fontFamily: "'JetBrains Mono',monospace" }}>6015</strong> — Renda Variável · Day Trade
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={confirmar} disabled={saving} style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg,#4caf82,#5fd99a)', color: '#0c0c0e', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>{saving ? 'Salvando…' : '✓ Confirmar pagamento'}</button>
          <button onClick={onCancel} style={{ padding: '11px 14px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border2)', color: 'var(--txt3)', fontSize: '13px', cursor: 'pointer' }}>Voltar</button>
        </div>
      </div>
    </div>
  )
}

function SubNotas({ notas, onExcluirNota }) {
  return (
    <tr>
      <td colSpan={13} style={{ padding: '0 0 0 36px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead><tr>{['Pregão','Conta','Resultado','Custos','IRRF Ret.','Obs.',''].map(h => <th key={h} style={{ padding: '5px 10px', textAlign: 'left', color: 'var(--txt3)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
          <tbody>{notas.map(n => (
            <tr key={n.id}>
              <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', color: 'var(--txt2)', fontFamily: "'JetBrains Mono',monospace" }}>{n.data_pregao ? dtBR(String(n.data_pregao).slice(0,10)) : '—'}</td>
              <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', color: 'var(--gold)', fontWeight: 700 }}>{n.conta_nome || <span style={{ color: 'var(--txt3)' }}>Consolidado</span>}</td>
              <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', fontFamily: "'JetBrains Mono',monospace", color: n.resultado_bruto >= 0 ? 'var(--green)' : 'var(--red)' }}>{R(n.resultado_bruto)}</td>
              <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', fontFamily: "'JetBrains Mono',monospace", color: 'var(--txt2)' }}>{R(n.custos)}</td>
              <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', fontFamily: "'JetBrains Mono',monospace", color: 'var(--txt2)' }}>{R(n.irrf_retido)}</td>
              <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', color: 'var(--txt3)' }}>{n.observacao || '—'}</td>
              <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)' }}>
                <button onClick={() => onExcluirNota(n.id)}
                  style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', background: 'rgba(224,92,106,.08)', border: '1px solid rgba(224,92,106,.2)', color: 'var(--red)', cursor: 'pointer' }}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </td>
    </tr>
  )
}

// ── Página ─────────────────────────────────────────────────────────────────────
export default function Financeiro() {
  const [resumo,   setResumo]   = useState([])
  const [contas,   setContas]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [pagando,  setPagando]  = useState(null)
  const [expanded, setExpanded] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try { const d = await api.get('financeiro'); setResumo(d.resumo || []); setContas(d.contas || []) }
    catch { setResumo([]); setContas([]) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  async function excluir(mes) {
    const grupo = resumo.find(r => r.mes_referencia === mes)
    if (!confirm(`Excluir ${(grupo?.notas?.length || 1) > 1 ? 'todas as notas' : 'esta nota'} de ${mesLabel(mes)}? Você poderá reimportar o PDF depois.`)) return
    for (const n of (grupo?.notas || [])) await api.post('financeiro', { action: 'excluir', id: n.id })
    load()
  }

  async function limparTudo() {
    if (!confirm('Excluir TODAS as notas do histórico? Você poderá reimportar os PDFs depois.')) return
    await api.post('financeiro', { action: 'limpar_tudo' })
    load()
  }

  async function excluirNota(id) {
    if (!confirm('Excluir esta nota? Você poderá reimportar o PDF depois.')) return
    await api.post('financeiro', { action: 'excluir', id })
    load()
  }

  const darf_pendente = resumo.filter(n => n.status === 'pendente').reduce((s, n) => s + n.darf_calculado - n.darf_pago, 0)
  const darf_diferido = resumo[0]?.darf_acumulado ?? 0
  const irrf_total    = resumo.reduce((s, n) => s + n.irrf_retido, 0)
  const prej_atual    = resumo[0]?.prejuizo_acumulado ?? 0

  const cell = (v, col = 'var(--txt)') => (
    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: col, whiteSpace: 'nowrap' }}>{v}</td>
  )

  return (
    <>
      <Nav />
      <main style={{ padding: '20px 24px', maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ marginBottom: '18px' }}>
          <h1 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '2px' }}>Financeiro</h1>
          <p style={{ fontSize: '11px', color: 'var(--txt3)' }}>Importação de notas de corretagem · DARF código 6015 · Day Trade 20%</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <UploadSection contas={contas} onSaved={load} />
        </div>

        {resumo.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[
              { lbl: 'DARF pendente',    val: R(darf_pendente),  col: darf_pendente > 0.01 ? 'var(--red)' : 'var(--green)',   sub: darf_pendente > 0.01 ? 'venc. último dia útil do mês seguinte' : 'tudo em dia' },
              { lbl: 'DARF diferido',    val: darf_diferido > 0 ? R(darf_diferido) : 'R$ 0,00', col: darf_diferido > 0 ? '#5ba4f5' : 'var(--txt3)', sub: darf_diferido > 0 ? 'abaixo R$10 — acumula prox. mês' : 'nenhum valor acumulado' },
              { lbl: 'IRRF retido (ac.)',val: R(irrf_total),     col: 'var(--txt2)',                                           sub: '1% retido pela corretora' },
              { lbl: 'Prejuízo acum.',   val: prej_atual > 0 ? R(-prej_atual) : 'R$ 0,00', col: prej_atual > 0 ? 'var(--yellow)' : 'var(--green)', sub: prej_atual > 0 ? 'compensa no próximo mês lucrativo' : 'nenhum a compensar' },
            ].map(({ lbl, val, col, sub }) => (
              <div key={lbl} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 18px', flex: 1, minWidth: '170px' }}>
                <div style={{ fontSize: '9px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{lbl}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '19px', fontWeight: 700, color: col, lineHeight: 1, marginBottom: '4px' }}>{val}</div>
                <div style={{ fontSize: '10px', color: 'var(--txt3)' }}>{sub}</div>
              </div>
            ))}
          </div>
        )}

        {darf_pendente > 0.01 && <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(224,92,106,.08)', border: '1px solid rgba(224,92,106,.25)', color: 'var(--red)', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>⚠️ {R(darf_pendente)} de DARF pendente — código 6015, pague até o último dia útil do mês seguinte.</div>}
        {darf_diferido > 0.01 && <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(91,164,245,.06)', border: '1px solid rgba(91,164,245,.2)', color: '#5ba4f5', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>ℹ️ {R(darf_diferido)} acumulado (IN 1888/2019 — abaixo de R$10,00, soma ao próximo mês lucrativo).</div>}

        {resumo.length > 0 && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>Notas de corretagem</span>
              <span style={{ fontSize: '10px', color: 'var(--txt3)', marginLeft: 'auto', marginRight: '12px' }}>IR 20% · código DARF 6015 · mínimo R$10,00 (IN 1888/2019)</span>
              <button onClick={limparTudo} style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '10px', background: 'rgba(224,92,106,.08)', border: '1px solid rgba(224,92,106,.25)', color: 'var(--red)', cursor: 'pointer', fontWeight: 700 }}>Limpar tudo</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr>
                    {['','Mês','Resultado','Custos','Lucro Líq.','Prej. Comp.','Base IR','IR 20%','IRRF Ret.','DARF','Vencimento','Status',''].map((h,i) => (
                      <th key={i} style={{ padding: '9px 12px', textAlign: 'left', fontSize: '9px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.8px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', background: 'var(--bg3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? <tr><td colSpan={13} style={{ padding: '24px', textAlign: 'center', color: 'var(--txt3)' }}>Carregando…</td></tr>
                    : resumo.map(n => {
                      const multi = (n.notas?.length || 1) > 1
                      const exp   = expanded[n.mes_referencia]
                      return [
                        <tr key={n.mes_referencia}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '10px 6px 10px 12px', borderBottom: '1px solid var(--border)' }}>
                            {multi && <button onClick={() => setExpanded(e => ({ ...e, [n.mes_referencia]: !e[n.mes_referencia] }))} style={{ background: 'transparent', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: '11px', padding: 0 }}>{exp ? '▼' : '▶'}</button>}
                          </td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {mesLabel(n.mes_referencia)}{multi && <span style={{ marginLeft: '5px', fontSize: '9px', color: 'var(--txt3)', fontWeight: 400 }}>{n.notas.length}c</span>}
                          </td>
                          {cell(R(n.resultado_bruto), n.resultado_bruto >= 0 ? 'var(--green)' : 'var(--red)')}
                          {cell(R(-Math.abs(n.custos)), 'var(--txt2)')}
                          {cell(R(n.lucro_liquido), n.lucro_liquido >= 0 ? 'var(--green)' : 'var(--red)')}
                          {cell(n.prejuizo_compensado > 0 ? R(-n.prejuizo_compensado) : '—', 'var(--yellow)')}
                          {cell(n.base_calculo > 0 ? R(n.base_calculo) : '—', 'var(--txt2)')}
                          {cell(n.ir_devido > 0 ? R(n.ir_devido) : '—', 'var(--txt)')}
                          {cell(n.irrf_retido > 0 ? R(-n.irrf_retido) : '—', 'var(--txt2)')}
                          {cell(
                            n.darf_calculado > 0.01 ? R(n.darf_calculado)
                              : n.status === 'diferido' ? <span style={{ color: '#5ba4f5' }} title="Abaixo de R$10 — acumula">{'< R$10'}</span>
                              : '—',
                            n.darf_calculado > 0.01 ? (n.status === 'pago' ? 'var(--green)' : 'var(--red)') : '#5ba4f5'
                          )}
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontSize: '11px', color: 'var(--txt3)', whiteSpace: 'nowrap' }}>
                            {n.status === 'pago' ? dtBR(n.data_pagamento) : (n.darf_calculado > 0.01 ? dtBR(n.vencimento) : '—')}
                          </td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}><StatusBadge s={n.status} /></td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {n.status === 'pendente' && <button onClick={() => setPagando(n)} style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, background: 'rgba(76,175,130,.12)', border: '1px solid rgba(76,175,130,.25)', color: 'var(--green)', cursor: 'pointer' }}>Pagar</button>}
                              <button onClick={() => excluir(n.mes_referencia)}
                                style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '10px', fontWeight: 600, background: 'rgba(224,92,106,.08)', border: '1px solid rgba(224,92,106,.2)', color: 'var(--red)', cursor: 'pointer' }}>
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>,
                        exp && multi ? <SubNotas key={`sub-${n.mes_referencia}`} notas={n.notas} onExcluirNota={excluirNota} /> : null
                      ]
                    })
                  }
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: '10px', color: 'var(--txt3)', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <span>📌 Fórmula: Lucro líq. = Resultado − Custos · Base IR = Lucro líq. − Prej. compensado · DARF = Base × 20% − IRRF retido</span>
              <span>📌 DARF &lt; R$10 acumula (IN 1888/2019) · Venc.: último dia útil do mês seguinte · Código 6015</span>
            </div>
          </div>
        )}

      </main>
      {pagando && <ModalPagar nota={pagando} onSave={() => { setPagando(null); load() }} onCancel={() => setPagando(null)} />}
    </>
  )
}
