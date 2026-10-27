import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [senha, setSenha]       = useState('')
  const [erro, setErro]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [serverOk, setServerOk] = useState(null) // null=verificando, true=ok, false=acordando
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  useEffect(() => {
    // Acorda o backend Render antes do usuário tentar logar
    const ctrl = new AbortController()
    const t = setTimeout(() => setServerOk(false), 3000) // mostra aviso após 3s sem resposta
    api.get('health').then(() => { clearTimeout(t); setServerOk(true) }).catch(() => { clearTimeout(t); setServerOk(false) })
    return () => { clearTimeout(t); ctrl.abort() }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const data = await api.post('auth', { action: 'login', email, senha })
      login(data.token, data.usuario)
      navigate(location.state?.from || (data.usuario.role === 'admin' ? '/admin' : '/'))
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: '8px', fontSize: '14px',
    background: 'var(--bg3)', border: '1px solid var(--border2)',
    color: 'var(--txt)', outline: 'none', transition: 'border .2s',
  }
  const lbl = { fontSize: '12px', fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: '6px' }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', background: 'var(--bg)',
    }}>
      {/* Glow sutil */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '500px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(201,168,76,.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '380px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg,#c9a84c,#e8c97a)',
            fontSize: '22px', fontWeight: 900, color: '#0c0c0e', marginBottom: '14px',
          }}>T</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt)' }}>
            Trader<span style={{ color: 'var(--gold)' }}>System</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--txt3)', marginTop: '4px' }}>
            Gestão de performance em trading
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: '14px', padding: '32px',
        }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '24px', color: 'var(--txt)' }}>
            Entrar na conta
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={lbl}>E-mail</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required style={inp}
                onFocus={e => e.target.style.borderColor = 'var(--gold-bd)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
            </div>

            <div>
              <label style={lbl}>Senha</label>
              <input
                type="password" value={senha} onChange={e => setSenha(e.target.value)}
                placeholder="••••••••" required style={inp}
                onFocus={e => e.target.style.borderColor = 'var(--gold-bd)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
            </div>

            {serverOk === false && !loading && (
              <div style={{ padding:'9px 13px', borderRadius:'8px', fontSize:'11px', background:'rgba(212,168,67,.08)', border:'1px solid rgba(212,168,67,.25)', color:'var(--yellow)', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'14px' }}>⏳</span>
                <span>Servidor acordando… a primeira conexão pode levar até 30s.</span>
              </div>
            )}

            {erro && (
              <div style={{
                padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
                background: 'var(--red-bg)', border: '1px solid var(--red-bd)', color: 'var(--red)',
              }}>
                {erro}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
              background: 'linear-gradient(135deg,#c9a84c,#e8c97a)',
              color: '#0c0c0e', border: 'none', marginTop: '4px',
              opacity: loading ? .7 : 1, transition: 'opacity .2s',
            }}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
