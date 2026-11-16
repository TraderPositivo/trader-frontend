import { useState, useEffect, useCallback, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import Nav from '../components/Nav'
import { api } from '../lib/api'

// worker via CDN para evitar problemas de bundling
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
function mesAtual() { return new Date().toISOString().slice(0, 7) }

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

// ── estilos base ───────────────────────────────────────────────────────────────
const inp = { width: '100%', padding: '8px 10px', borderRadius: '7px', fontSize: '13px', background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--txt)', outline: 'none', fontFamily: 'inherit' }
const lbl = { fontSize: '10px', color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.8px', display: 'block', marginBottom: '4px' }

const STATUS = {
  pendente: { label: 'Pendente', cor: '#e05c6a', bg: 'rgba(224,92,106,.1)',   bd: 'rgba(224,92,106,.25)' },
  pago:     { label: 'Pago',     cor: '#4caf82', bg: 'rgba(76,175,130,.1)',   bd: 'rgba(76,175,130,.25)' },
  isento:   { label: 'Isento',   cor: '#8888a0', bg: 'rgba(136,136,160,.08)', bd: 'rgba(136,136,160,.2)' },
  prejuizo: { label: 'Prejuízo', cor: '#d4a843', bg: 'rgba(212,168,67,.08)', bd: 'rgba(212,168,67,.2)'   },
  diferido: { label: 'Diferido', cor: '#5ba4f5', bg: 'rgba(91,164,245,.08)', bd: 'rgba(91,164,245,.22)'  },
}
function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.isento
  return <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: s.bg, border: `1px solid ${s.bd}`, color: s.cor, fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>{s.label}</span>
}

// ── Upload + Review ────────────────────────────────────────────────────────────
function UploadSection({ contas, onSaved }) {
  const [step,    setStep]    = useState('idle')   // idle | parsing | review | saving
  const [fields,  setFields]  = useState(null)
  const [erroMsg, setErroMsg] = useState('')
  const [drag,    setDrag]    = useState(false)
  const fileRef = useRef()

  async function processFile(file) {
    if (!file || file.type !== 'application/pdf') {
      setErroMsg('Selecione um arquivo PDF válido'); return
    }
    setStep('parsing'); setErroMsg('')
    try {
      const text   = await extractTextFromPDF(file)
      const parsed = await api.post('financeiro/parse-pdf', { text })
      setFields({
        mes_referencia: parsed.mes_referencia || mesAtual(),
        conta_id:       '',
        resultado_bruto: parsed.resultado_bruto != null ? String(parsed.resultado_bruto) : '',
        custos:          parsed.custos          != null ? String(parsed.custos)          : '',
        irrf_retido:     parsed.irrf_retido     != null ? String(parsed.irrf_retido)     : '',
        observacao:      '',
        confidence:      parsed.confidence,
      })
      setStep('review')
    } catch (e) {
      setErroMsg(e.message || 'Erro ao processar PDF')
      setStep('idle')
    }
  }

  function onDrop(e) {
    e.preventDefault(); setDrag(false)
    processFile(e.dataTransfer.files[0])
  }

  async function salvar() {
    setStep('saving')
    try {
      await api.post('financeiro', {
        action:          'salvar',
        mes_referencia:  fields.mes_referencia,
        conta_id:        fields.conta_id ? parseInt(fields.conta_id) : null,
        resultado_bruto: parseFloat(fields.resultado_bruto) || 0,
        custos:          parseFloat(fields.custos)          || 0,
        irrf_retido:     parseFloat(fields.irrf_retido)     || 0,
        observacao:      fields.observacao || null,
      })
      setStep('idle'); setFields(null)
      onSaved()
    } catch (e) {
      setErroMsg(e.message)
      setStep('review')
    }
  }

  function set(k, v) { setFields(f => ({ ...f, [k]: v })) }

  // ── idle: zona de upload ─────────────────────────────────────────────────
  if (step === 'idle') return (
    <div>
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${drag ? 'var(--gold)' : 'var(--border2)'}`,
          borderRadius: '14px',
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: drag ? 'var(--gold-bg)' : 'var(--bg2)',
          transition: 'all .2s',
        }}
      >
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>📄</div>
        <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', color: 'var(--txt)' }}>
          Importe a nota de corretagem
        </div>
        <p style={{ fontSize: '12px', color: 'var(--txt3)', lineHeight: 1.7 }}>
          Arraste o PDF aqui ou clique para selecionar<br />
          <span style={{ fontSize: '11px' }}>Profit → Relatório → Notas de Corretagem → Exportar PDF</span>
        </p>
        <div style={{ marginTop: '16px', display: 'inline-block', padding: '8px 20px', borderRadius: '8px', background: 'var(--gold-bg)', border: '1px solid var(--gold-bd)', color: 'var(--gold)', fontSize: '12px', fontWeight: 700 }}>
          Selecionar PDF
        </div>
      </div>
      <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => processFile(e.target.files[0])} />
      {erroMsg && <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(224,92,106,.08)', border: '1px solid rgba(224,92,106,.25)', color: 'var(--red)', fontSize: '12px' }}>{erroMsg}</div>}
    </div>
  )

  // ── parsing: spinner ─────────────────────────────────────────────────────
  if (step === 'parsing') return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: '28px', marginBottom: '12px', animation: 'spin 1s linear infinite' }}>⏳</div>
      <div style={{ fontSize: '14px', color: 'var(--txt3)' }}>Lendo PDF e extraindo dados…</div>
    </div>
  )

  // ── review: campos extraídos + edição ───────────────────────────────────
  const low = fields.confidence < 2
  const lucroLiq = (parseFloat(fields.resultado_bruto) || 0) - (parseFloat(fields.custos) || 0)
  const liqCol   = lucroLiq > 0 ? 'var(--green)' : lucroLiq < 0 ? 'var(--red)' : 'var(--txt3)'

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700 }}>Confirmar dados extraídos do PDF</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: low ? 'var(--yellow)' : 'var(--green)' }}>
          {low ? '⚠ Verifique os campos — extração parcial' : '✓ Dados extraídos com sucesso'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={lbl}>Mês de referência</label>
          <input style={inp} type="month" value={fields.mes_referencia} onChange={e => set('mes_referencia', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Conta</label>
          <select style={inp} value={fields.conta_id} onChange={e => set('conta_id', e.target.value)}>
            <option value="">Consolidado (todas)</option>
            {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Resultado bruto day trade (R$)</label>
          <input style={{ ...inp, borderColor: !fields.resultado_bruto ? 'rgba(224,92,106,.5)' : 'var(--border2)' }}
            type="number" step="0.01" value={fields.resultado_bruto} onChange={e => set('resultado_bruto', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Custos — emolumentos + corretagem (R$)</label>
          <input style={{ ...inp, borderColor: !fields.custos ? 'rgba(224,92,106,.5)' : 'var(--border2)' }}
            type="number" step="0.01" value={fields.custos} onChange={e => set('custos', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>IRRF retido 1% (R$)</label>
          <input style={{ ...inp, borderColor: !fields.irrf_retido ? 'rgba(212,168,67,.5)' : 'var(--border2)' }}
            type="number" step="0.01" value={fields.irrf_retido} onChange={e => set('irrf_retido', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Observação</label>
          <input style={inp} type="text" placeholder="opcional" value={fields.observacao} onChange={e => set('observacao', e.target.value)} />
        </div>
      </div>

      <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg3)', border: '1px solid var(--border2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--txt3)' }}>Lucro líquido</span>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '16px', fontWeight: 700, color: liqCol }}>
          {fields.resultado_bruto || fields.custos ? R(lucroLiq) : '—'}
        </span>
      </div>

      {erroMsg && <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '6px', background: 'rgba(224,92,106,.08)', border: '1px solid rgba(224,92,106,.25)', color: 'var(--red)', fontSize: '12px' }}>{erroMsg}</div>}

      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
        <button onClick={salvar} disabled={step === 'saving' || !fields.mes_referencia}
          style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#0c0c0e', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', opacity: step === 'saving' ? .6 : 1 }}>
          {step === 'saving' ? 'Salvando…' : 'Salvar nota'}
        </button>
        <button onClick={() => { setStep('idle'); setFields(null); setErroMsg('') }}
          style={{ padding: '11px 18px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border2)', color: 'var(--txt3)', fontSize: '13px', cursor: 'pointer' }}>
          ← Novo PDF
        </button>
      </div>
    </div>
  )
}

// ── Modal pagar ────────────────────────────────────────────────────────────────
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
          <button onClick={confirmar} disabled={saving} style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg,#4caf82,#5fd99a)', color: '#0c0c0e', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}>
            {saving ? 'Salvando…' : '✓ Confirmar pagamento'}
          </button>
          <button onClick={onCancel} style={{ padding: '11px 14px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border2)', color: 'var(--txt3)', fontSize: '13px', cursor: 'pointer' }}>Voltar</button>
        </div>
      </div>
    </div>
  )
}

// ── Sub-linhas por conta ───────────────────────────────────────────────────────
function SubNotas({ notas }) {
  return (
    <tr>
      <td colSpan={13} style={{ padding: '0 0 0 36px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead><tr>{['Conta','Resultado','Custos','IRRF Retido','Obs.'].map(h => <th key={h} style={{ padding: '5px 10px', textAlign: 'left', color: 'var(--txt3)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
          <tbody>
            {notas.map(n => (
              <tr key={n.id}>
                <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', color: 'var(--gold)', fontWeight: 700 }}>{n.conta_nome || <span style={{ color: 'var(--txt3)' }}>Consolidado</span>}</td>
                <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', fontFamily: "'JetBrains Mono',monospace", color: n.resultado_bruto >= 0 ? 'var(--green)' : 'var(--red)' }}>{R(n.resultado_bruto)}</td>
                <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', fontFamily: "'JetBrains Mono',monospace", color: 'var(--txt2)' }}>{R(n.custos)}</td>
                <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', fontFamily: "'JetBrains Mono',monospace", color: 'var(--txt2)' }}>{R(n.irrf_retido)}</td>
                <td style={{ padding: '5px 10px', borderBottom: '1px solid var(--border)', color: 'var(--txt3)' }}>{n.observacao || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
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
    if (!confirm(`Excluir ${(grupo?.notas?.length || 1) > 1 ? 'todas as notas' : 'esta nota'} de ${mesLabel(mes)}?`)) return
    for (const n of (grupo?.notas || [])) await api.post('financeiro', { action: 'excluir', id: n.id })
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '2px' }}>Financeiro</h1>
            <p style={{ fontSize: '11px', color: 'var(--txt3)' }}>Importação de notas de corretagem · DARF código 6015 · Day Trade 20%</p>
          </div>
        </div>

        {/* Upload */}
        <div style={{ marginBottom: '20px' }}>
          <UploadSection contas={contas} onSaved={load} />
        </div>

        {/* Cards resumo */}
        {(resumo.length > 0 || loading) && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[
              { lbl: 'DARF pendente',    val: R(darf_pendente),  col: darf_pendente > 0.01 ? 'var(--red)' : 'var(--green)',   sub: darf_pendente > 0.01 ? 'venc. último dia útil do mês seguinte' : 'tudo em dia' },
              { lbl: 'DARF diferido',    val: darf_diferido > 0 ? R(darf_diferido) : 'R$ 0,00', col: darf_diferido > 0 ? '#5ba4f5' : 'var(--txt3)', sub: darf_diferido > 0 ? 'abaixo R$10 — acumula para o próx. mês' : 'nenhum valor acumulado' },
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
        {darf_diferido > 0.01 && <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(91,164,245,.06)', border: '1px solid rgba(91,164,245,.2)', color: '#5ba4f5', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>ℹ️ {R(darf_diferido)} acumulado (IN 1888/2019 — DARF abaixo de R$10,00 acumula para o próximo mês lucrativo).</div>}

        {/* Tabela */}
        {resumo.length > 0 && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>Notas de corretagem</span>
              <span style={{ fontSize: '10px', color: 'var(--txt3)', marginLeft: 'auto' }}>IR 20% · código DARF 6015 · mínimo R$10,00 (IN 1888/2019)</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr>
                    {['','Mês','Resultado','Custos','Lucro Líq.','Prej. Comp.','Base IR','IR 20%','IRRF Ret.','DARF','Vencimento','Status',''].map((h, i) => (
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
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}><StatusBadge status={n.status} /></td>
                          <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {n.status === 'pendente' && <button onClick={() => setPagando(n)} style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, background: 'rgba(76,175,130,.12)', border: '1px solid rgba(76,175,130,.25)', color: 'var(--green)', cursor: 'pointer' }}>Pagar</button>}
                              <button onClick={() => excluir(n.mes_referencia)}
                                onMouseEnter={e => e.target.style.color = 'var(--red)'}
                                onMouseLeave={e => e.target.style.color = 'var(--txt3)'}
                                style={{ padding: '4px 7px', borderRadius: '5px', fontSize: '10px', background: 'transparent', border: 'none', color: 'var(--txt3)', cursor: 'pointer' }}>✕</button>
                            </div>
                          </td>
                        </tr>,
                        exp && multi ? <SubNotas key={`sub-${n.mes_referencia}`} notas={n.notas} /> : null
                      ]
                    })
                  }
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: '10px', color: 'var(--txt3)', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <span>📌 Prejuízo compensa automaticamente no próximo mês lucrativo</span>
              <span>📌 DARF abaixo de R$10,00 acumula para o próximo mês (IN 1888/2019)</span>
              <span>📌 Vencimento: último dia útil do mês seguinte</span>
            </div>
          </div>
        )}

      </main>

      {pagando && <ModalPagar nota={pagando} onSave={() => { setPagando(null); load() }} onCancel={() => setPagando(null)} />}
    </>
  )
}
