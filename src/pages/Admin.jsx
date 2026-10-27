import { useState, useEffect } from 'react'
import Nav from '../components/Nav'
import { api } from '../lib/api'

const inp = {
  width: '100%', padding: '10px 13px', borderRadius: '8px', fontSize: '13px',
  background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--txt)', outline: 'none',
}
const lbl = { fontSize: '11px', fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.4px' }

const PLANOS = { lives: 'Lives Gravadas', sala: 'Sala ao Vivo', mentoria: 'Mentoria' }

function hojeSP() { return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }) }
function maisDias(iso, dias) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}
function fmtData(iso) { return iso ? iso.split('-').reverse().join('/') : '—' }

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '18px 20px' }}>
      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '26px', fontWeight: 700, color: color || 'var(--txt)' }}>{value}</p>
    </div>
  )
}

export default function Admin() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState({})
  const [msg, setMsg]           = useState('')
  const [saving, setSaving]     = useState(false)

  async function load() {
    setLoading(true)
    try { setUsuarios(await api.get('admin')) }
    catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function abrirModal(u = null) {
    setMsg('')
    setForm(u
      ? { id: u.id, nome: u.nome, email: u.email, role: u.role, ativo: u.ativo, senha: '', plano: u.plano || 'sala', acesso_ate: u.acesso_ate || '' }
      : { role: 'user', ativo: 1, senha: '', plano: 'sala', acesso_ate: maisDias(hojeSP(), 30) }
    )
    setModal(true)
  }

  async function salvar() {
    if (!form.nome?.trim() || !form.email?.trim()) { setMsg('Nome e e-mail obrigatórios'); return }
    if (!form.id && !form.senha?.trim()) { setMsg('Senha obrigatória para novo usuário'); return }
    setSaving(true)
    try {
      await api.post('admin', { action: 'salvar_usuario', ...form })
      setModal(false)
      load()
    } catch (err) {
      setMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function renovar(u, dias = 30) {
    await api.post('admin', { action: 'renovar_acesso', id: u.id, dias })
    load()
  }

  async function toggleAtivo(u) {
    await api.post('admin', { action: 'toggle_usuario', id: u.id, ativo: u.ativo ? 0 : 1 })
    load()
  }

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const clientes = usuarios.filter(u => u.role !== 'admin')
  const ativos   = clientes.filter(u => u.ativo == 1).length
  const inativos = clientes.filter(u => u.ativo == 0).length

  return (
    <>
      <Nav />
      <main style={{ padding: '28px', maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '3px' }}>Usuários</h1>
            <p style={{ fontSize: '12px', color: 'var(--txt3)' }}>Gestão de acessos e contas</p>
          </div>
          <button onClick={() => abrirModal()} style={{
            padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
            background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#0c0c0e', border: 'none',
          }}>
            + Novo usuário
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '24px' }}>
          <StatCard label="Ativos"  value={ativos}   color="var(--green)" />
          <StatCard label="Inativos" value={inativos} color="var(--txt3)" />
          <StatCard label="Total"   value={clientes.length} color="var(--gold)" />
        </div>

        {/* Lista */}
        {loading ? (
          <p style={{ color: 'var(--txt3)', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>Carregando…</p>
        ) : clientes.length === 0 ? (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--txt3)', fontSize: '13px' }}>Nenhum usuário cadastrado.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {clientes.map(u => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '14px 18px', gap: '12px',
                opacity: u.ativo ? 1 : .55, transition: 'opacity .2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: u.ativo ? 'var(--gold-bg)' : 'var(--bg3)',
                    border: `1px solid ${u.ativo ? 'var(--gold-bd)' : 'var(--border2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: u.ativo ? 'var(--gold)' : 'var(--txt3)',
                    flexShrink: 0,
                  }}>
                    {u.nome?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{u.nome}</span>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                        background: u.ativo ? 'var(--green-bg)' : 'var(--red-bg)',
                        color: u.ativo ? 'var(--green)' : 'var(--red)',
                        border: `1px solid ${u.ativo ? 'var(--green-bd)' : 'var(--red-bd)'}`,
                      }}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--txt3)', marginTop: '1px' }}>{u.email}</p>
                    <p style={{ fontSize: '11px', marginTop: '3px', color: 'var(--txt2)' }}>
                      {PLANOS[u.plano] || 'Sem plano'} ·{' '}
                      <span style={{ fontWeight: 700, color: !u.acesso_ate || u.acesso_ate < hojeSP() ? 'var(--red)' : 'var(--green)' }}>
                        {!u.acesso_ate ? 'sem acesso' : u.acesso_ate < hojeSP() ? `venceu em ${fmtData(u.acesso_ate)}` : `acesso até ${fmtData(u.acesso_ate)}`}
                      </span>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button onClick={() => renovar(u)} title="Soma 30 dias ao acesso" style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    background: 'var(--gold-bg)', border: '1px solid var(--gold-bd)', color: 'var(--gold)',
                  }}>
                    +30 dias
                  </button>
                  <button onClick={() => abrirModal(u)} style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--txt2)',
                  }}>
                    Editar
                  </button>
                  <button onClick={() => toggleAtivo(u)} style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                    background: u.ativo ? 'var(--red-bg)' : 'var(--green-bg)',
                    border: `1px solid ${u.ativo ? 'var(--red-bd)' : 'var(--green-bd)'}`,
                    color: u.ativo ? 'var(--red)' : 'var(--green)',
                  }}>
                    {u.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {modal && (
        <div onClick={e => e.target === e.currentTarget && setModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(6px)',
        }}>
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border2)',
            borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '440px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>{form.id ? 'Editar usuário' : 'Novo usuário'}</span>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--txt3)', fontSize: '18px', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={lbl}>Nome</label>
                <input style={inp} value={form.nome || ''} onChange={f('nome')} placeholder="Nome completo"
                  onFocus={e => e.target.style.borderColor = 'var(--gold-bd)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'} />
              </div>
              <div>
                <label style={lbl}>E-mail</label>
                <input style={inp} type="email" value={form.email || ''} onChange={f('email')} placeholder="email@exemplo.com"
                  onFocus={e => e.target.style.borderColor = 'var(--gold-bd)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'} />
              </div>
              <div>
                <label style={lbl}>{form.id ? 'Nova senha (deixe em branco para manter)' : 'Senha'}</label>
                <input style={inp} type="password" value={form.senha || ''} onChange={f('senha')} placeholder="••••••••"
                  onFocus={e => e.target.style.borderColor = 'var(--gold-bd)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'} />
              </div>
              <div>
                <label style={lbl}>Perfil</label>
                <select style={inp} value={form.role || 'user'} onChange={f('role')}>
                  <option value="user">Usuário</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={lbl}>Plano</label>
                  <select style={inp} value={form.plano || 'sala'} onChange={f('plano')}>
                    {Object.entries(PLANOS).map(([v, n]) => <option key={v} value={v}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Acesso até</label>
                  <input style={inp} type="date" value={form.acesso_ate || ''} onChange={f('acesso_ate')} />
                </div>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--txt3)', marginTop: '-6px' }}>
                Depois dessa data o aluno continua entrando na Área do aluno, mas o TraderSystem fica bloqueado.
              </p>
            </div>

            {msg && (
              <div style={{ marginTop: '12px', padding: '10px 13px', borderRadius: '7px', fontSize: '12px', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', color: 'var(--red)' }}>
                {msg}
              </div>
            )}

            <button onClick={salvar} disabled={saving} style={{
              width: '100%', marginTop: '20px', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
              background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#0c0c0e', border: 'none',
              opacity: saving ? .7 : 1,
            }}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
