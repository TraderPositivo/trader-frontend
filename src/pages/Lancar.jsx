import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'
import { api } from '../lib/api'

const inp = { width:'100%', padding:'8px 10px', borderRadius:'7px', fontSize:'13px', background:'var(--bg3)', border:'1px solid var(--border2)', color:'var(--txt)', outline:'none', fontFamily:'inherit' }
const lbl = { fontSize:'10px', color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'.8px', display:'block', marginBottom:'4px' }

function R(v) {
  const abs = Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits:2, maximumFractionDigits:2 })
  return (v < 0 ? '-' : '') + 'R$ ' + abs
}
function hojeISO() { return new Date().toISOString().slice(0, 10) }
function horaAtual() { return new Date().toTimeString().slice(0, 5) }

function parseProfitCSV(text) {
  const lines = text.split(/\r?\n/)
  const headerIdx = lines.findIndex(l => l.includes('Ativo') && l.includes('Abertura'))
  if (headerIdx === -1) throw new Error('Formato não reconhecido — não achei o cabeçalho do Profit')
  const dataLines = lines.slice(headerIdx + 1).filter(l => l.trim() && !l.startsWith('Conta') && !l.startsWith('Titular'))
  const parseBR = v => parseFloat((v || '0').replace(/\./g,'').replace(',','.')) || 0
  return dataLines.map(line => {
    const cols = line.split(';')
    if (cols.length < 13) return null
    const abertura = cols[1]?.trim() || '', fechamento = cols[2]?.trim() || ''
    const [datePart, timePart] = abertura.split(' ')
    const [, timeSai] = fechamento.split(' ')
    if (!datePart) return null
    const [d, m, y] = datePart.split('/')
    return {
      data_operacao: `${y}-${m}-${d}`,
      tipo: (cols[6]?.trim() || 'C') === 'V' ? 'VENDA' : 'COMPRA',
      horario_entrada: (timePart || '09:00').slice(0, 5),
      horario_saida:   (timeSai  || '09:00').slice(0, 5),
      pontos:    parseBR(cols[13]),
      resultado: parseBR(cols[12]),
      custo: 0,
      observacao: `${cols[0]?.trim() || ''} (${cols[4]?.trim() || '1'} cts) — Profit`,
    }
  }).filter(Boolean)
}

function ManualForm({ contas, onSuccess }) {
  const [cid,  setCid]  = useState(contas[0]?.id || '')
  const [tipo, setTipo] = useState('COMPRA')
  const [pts,  setPts]  = useState('')
  const [res,  setRes]  = useState('')
  const [ent,  setEnt]  = useState(horaAtual())
  const [sai,  setSai]  = useState(horaAtual())
  const [obs,  setObs]  = useState('')
  const [msg,  setMsg]  = useState('')
  const [saving, setSaving] = useState(false)

  const preview = parseFloat(res) || 0
  const prevCol = preview > 0 ? 'var(--green)' : preview < 0 ? 'var(--red)' : 'var(--txt3)'

  async function registrar() {
    if (!cid || !res) { setMsg('Conta e resultado são obrigatórios'); return }
    setSaving(true); setMsg('')
    try {
      await api.post('operacoes', {
        action: 'salvar', conta_id: parseInt(cid), data_operacao: hojeISO(),
        tipo, horario_entrada: ent, horario_saida: sai,
        pontos: parseFloat(pts) || 0, resultado: parseFloat(res), custo: 0, observacao: obs,
      })
      setPts(''); setRes(''); setObs(''); setEnt(horaAtual()); setSai(horaAtual())
      setMsg('✓ Registrado!')
      setTimeout(() => setMsg(''), 2500)
      onSuccess()
    } catch (err) { setMsg('⚠ ' + err.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
      <div>
        <label style={lbl}>Conta</label>
        <select style={inp} value={cid} onChange={e => setCid(e.target.value)}>
          {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
        <div>
          <label style={lbl}>Tipo</label>
          <select style={inp} value={tipo} onChange={e => setTipo(e.target.value)}>
            <option>COMPRA</option><option>VENDA</option>
          </select>
        </div>
        <div>
          <label style={lbl}>Resultado (R$)</label>
          <input style={inp} type="number" placeholder="ex: 600 ou -250" value={res} onChange={e => setRes(e.target.value)} />
        </div>
        <div>
          <label style={lbl}>Pontos (ref.)</label>
          <input style={inp} type="number" placeholder="ex: 300" value={pts} onChange={e => setPts(e.target.value)} />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
          <div><label style={lbl}>Entrada</label><input style={inp} type="time" value={ent} onChange={e => setEnt(e.target.value)} /></div>
          <div><label style={lbl}>Saída</label>  <input style={inp} type="time" value={sai} onChange={e => setSai(e.target.value)} /></div>
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={lbl}>Observação</label>
          <textarea style={{ ...inp, resize:'vertical', minHeight:'52px' }} placeholder="Setup, contexto..." value={obs} onChange={e => setObs(e.target.value)} />
        </div>
      </div>

      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'20px', fontWeight:700, textAlign:'center', padding:'12px', borderRadius:'8px', background:'var(--bg3)', border:'1px solid var(--border2)', color:prevCol, transition:'.3s' }}>
        {res ? R(preview) : '— preencha o resultado —'}
      </div>

      {msg && <div style={{ fontSize:'13px', padding:'10px 12px', borderRadius:'7px', textAlign:'center', background: msg.startsWith('✓') ? 'rgba(76,175,130,.08)' : 'rgba(224,92,106,.08)', border:`1px solid ${msg.startsWith('✓') ? 'rgba(76,175,130,.25)' : 'rgba(224,92,106,.25)'}`, color: msg.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{msg}</div>}

      <button onClick={registrar} disabled={saving} style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#c9a84c,#e8c97a)', color:'#0c0c0e', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:800, opacity:saving?.7:1, cursor:saving?'not-allowed':'pointer' }}>
        {saving ? 'REGISTRANDO…' : 'REGISTRAR OPERAÇÃO'}
      </button>
    </div>
  )
}

function CsvForm({ contas, onSuccess }) {
  const [cid,      setCid]      = useState(contas[0]?.id || '')
  const [preview,  setPreview]  = useState(null)
  const [fileName, setFileName] = useState('')
  const [msg,      setMsg]      = useState('')
  const [loading,  setLoading]  = useState(false)

  function handleFile(e) {
    const file = e.target.files[0]; if (!file) return
    setFileName(file.name); setMsg(''); setPreview(null)
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const ops = parseProfitCSV(ev.target.result)
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
    <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
      <div>
        <label style={lbl}>Conta destino</label>
        <select style={inp} value={cid} onChange={e => setCid(e.target.value)}>
          {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      <label style={{ display:'block', border:'2px dashed var(--border2)', borderRadius:'10px', padding:'28px', textAlign:'center', cursor:'pointer', background:'var(--bg3)', color:'var(--txt3)', fontSize:'13px' }}>
        <input type="file" accept=".csv,.txt" style={{ display:'none' }} onChange={handleFile} />
        {fileName
          ? <><div style={{ color:'var(--txt)', fontWeight:700, marginBottom:'4px', fontSize:'14px' }}>📄 {fileName}</div><div>clique para trocar</div></>
          : <><div style={{ fontSize:'30px', marginBottom:'8px' }}>📂</div><div style={{ fontWeight:700, marginBottom:'4px' }}>Clique para selecionar o CSV do Profit</div><div style={{ fontSize:'11px', color:'var(--txt3)' }}>Exportar em: Relatório → Operações Realizadas → CSV</div></>
        }
      </label>

      {preview && (
        <div style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderRadius:'8px', overflow:'hidden' }}>
          <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)', fontSize:'11px', color:'var(--txt3)', textTransform:'uppercase', letterSpacing:'1px' }}>{preview.length} operações detectadas</div>
          <div style={{ maxHeight:'200px', overflowY:'auto' }}>
            {preview.map((op, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 12px', borderBottom:'1px solid var(--border)', fontSize:'12px' }}>
                <span style={{ color:'var(--txt3)', fontFamily:"'JetBrains Mono',monospace" }}>{op.data_operacao} {op.horario_entrada}</span>
                <span style={{ color: op.tipo === 'COMPRA' ? 'var(--green)' : 'var(--red)', fontWeight:700 }}>{op.tipo}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color: op.resultado >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {op.resultado >= 0 ? '+' : ''}R$ {op.resultado.toLocaleString('pt-BR', { minimumFractionDigits:2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {msg && <div style={{ fontSize:'13px', padding:'10px 12px', borderRadius:'7px', textAlign:'center', background: msg.startsWith('✓') ? 'rgba(76,175,130,.08)' : 'rgba(224,92,106,.08)', border:`1px solid ${msg.startsWith('✓') ? 'rgba(76,175,130,.25)' : 'rgba(224,92,106,.25)'}`, color: msg.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{msg}</div>}

      <button onClick={importar} disabled={!preview?.length || loading} style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#c9a84c,#e8c97a)', color:'#0c0c0e', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:800, opacity:(!preview?.length || loading) ? .5 : 1, cursor: preview?.length ? 'pointer' : 'not-allowed' }}>
        {loading ? 'IMPORTANDO…' : preview ? `IMPORTAR ${preview.length} OPERAÇÕES` : 'SELECIONE UM ARQUIVO'}
      </button>
    </div>
  )
}

export default function Lancar() {
  const [contas,  setContas]  = useState([])
  const [tab,     setTab]     = useState('csv')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('contas').then(setContas).catch(() => {})
  }, [])

  function handleSuccess() {
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (!contas.length) return (
    <>
      <Nav />
      <main style={{ padding:'40px 24px', textAlign:'center', color:'var(--txt3)', fontSize:'13px' }}>Carregando contas…</main>
    </>
  )

  return (
    <>
      <Nav />
      <main style={{ padding:'24px', maxWidth:'560px', margin:'0 auto' }}>
        <div style={{ marginBottom:'20px' }}>
          <h1 style={{ fontSize:'17px', fontWeight:700, marginBottom:'2px' }}>Lançar Operação</h1>
          <p style={{ fontSize:'11px', color:'var(--txt3)' }}>Registre operações manualmente ou importe o CSV do Profit.</p>
        </div>

        {success && (
          <div style={{ padding:'12px 16px', borderRadius:'8px', background:'rgba(76,175,130,.08)', border:'1px solid rgba(76,175,130,.25)', color:'var(--green)', fontSize:'13px', fontWeight:600, marginBottom:'16px', display:'flex', alignItems:'center', gap:'8px' }}>
            ✓ Lançado! <button onClick={() => navigate('/')} style={{ marginLeft:'auto', background:'none', border:'1px solid rgba(76,175,130,.3)', color:'var(--green)', borderRadius:'5px', padding:'3px 10px', fontSize:'11px', cursor:'pointer', fontWeight:600 }}>Ver no Dashboard →</button>
          </div>
        )}

        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'14px', overflow:'hidden' }}>
          <div style={{ display:'flex', padding:'14px 18px 0', gap:'4px', borderBottom:'1px solid var(--border)' }}>
            {[{id:'csv',label:'📂 CSV Profit'},{id:'manual',label:'✏️ Manual'}].map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                padding:'7px 16px', borderRadius:'7px 7px 0 0', fontSize:'12px', fontWeight:700, border:'1px solid', cursor:'pointer', transition:'.15s',
                background: tab===id ? 'var(--bg3)' : 'transparent',
                color: tab===id ? 'var(--gold)' : 'var(--txt3)',
                borderColor: tab===id ? 'var(--gold-bd)' : 'transparent',
                borderBottom: tab===id ? '1px solid var(--bg3)' : '1px solid transparent',
                marginBottom: tab===id ? '-1px' : '0',
              }}>{label}</button>
            ))}
          </div>
          <div style={{ padding:'22px 20px' }}>
            {tab === 'csv'
              ? <CsvForm   contas={contas} onSuccess={handleSuccess} />
              : <ManualForm contas={contas} onSuccess={handleSuccess} />
            }
          </div>
        </div>
      </main>
    </>
  )
}
