import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export default function Login() {
  const [modo, setModo]           = useState('login') // 'login' | 'cadastro'
  const [nome, setNome]           = useState('')
  const [email, setEmail]         = useState('')
  const [senha, setSenha]         = useState('')
  const [confirma, setConfirma]   = useState('')
  const [erro, setErro]           = useState('')
  const [ok, setOk]               = useState('')
  const [loading, setLoading]     = useState(false)
  const [serverOk, setServerOk]   = useState(null)
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  useEffect(() => {
    const t = setTimeout(() => setServerOk(false), 3000)
    api.get('health').then(() => { clearTimeout(t); setServerOk(true) }).catch(() => { clearTimeout(t); setServerOk(false) })
    return () => clearTimeout(t)
  }, [])

  function trocarModo(m) {
    setModo(m); setErro(''); setOk('')
    setNome(''); setEmail(''); setSenha(''); setConfirma('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro(''); setOk('')
    if (modo === 'cadastro' && senha !== confirma) {
      setErro('As senhas não coincidem'); return
    }
    setLoading(true)
    try {
      if (modo === 'login') {
        const data = await api.post('auth', { action: 'login', email, senha })
        login(data.token, data.usuario)
        navigate(location.state?.from || (data.usuario.role === 'admin' ? '/admin' : '/aluno'))
      } else {
        const data = await api.post('auth', { action: 'registrar', nome, email, senha })
        login(data.token, data.usuario)
        navigate('/aluno')
      }
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: '8px', fontSize: '14px',
    background: 'var(--bg3)', border: '1px solid var(--border2)',
    color: 'var(--txt)', outline: 'none', transition: 'border .2s', boxSizing: 'border-box',
  }
  const lbl = { fontSize: '12px', fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: '6px' }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', background: 'var(--bg)',
    }}>
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
          {/* Toggle Login / Cadastro */}
          <div style={{
            display: 'flex', borderRadius: '8px', overflow: 'hidden',
            border: '1px solid var(--border)', marginBottom: '24px',
          }}>
            {['login', 'cadastro'].map(m => (
              <button key={m} onClick={() => trocarModo(m)} style={{
                flex: 1, padding: '9px', fontSize: '13px', fontWeight: 600, border: 'none',
                background: modo === m ? 'linear-gradient(135deg,#c9a84c,#e8c97a)' : 'transparent',
                color: modo === m ? '#0c0c0e' : 'var(--txt3)',
                cursor: 'pointer', transition: 'all .2s',
              }}>
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {modo === 'cadastro' && (
              <div>
                <label style={lbl}>Nome completo</label>
                <input
                  type="text" value={nome} onChange={e => setNome(e.target.value)}
                  placeholder="Seu nome" required style={inp}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-bd)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
              </div>
            )}

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
                placeholder="••••••••" required minLength={modo === 'cadastro' ? 6 : undefined} style={inp}
                onFocus={e => e.target.style.borderColor = 'var(--gold-bd)'}
                onBlur={e => e.target.style.borderColor = 'var(--border2)'}
              />
              {modo === 'cadastro' && (
                <div style={{ fontSize: '11px', color: 'var(--txt3)', marginTop: '5px' }}>
                  Mínimo 6 caracteres
                </div>
              )}
            </div>

            {modo === 'cadastro' && (
              <div>
                <label style={lbl}>Confirmar senha</label>
                <input
                  type="password" value={confirma} onChange={e => setConfirma(e.target.value)}
                  placeholder="••••••••" required style={inp}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-bd)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
              </div>
            )}

            {serverOk === false && !loading && (
              <div style={{ padding:'9px 13px', borderRadius:'8px', fontSize:'11px', background:'rgba(212,168,67,.08)', border:'1px solid rgba(212,168,67,.25)', color:'var(--yellow)', display:'flex', alignItems:'center', gap:'8px' }}>
                <span>⏳</span>
                <span>Servidor acordando… a primeira conexão pode levar até 30s.</span>
              </div>
            )}

            {erro && (
              <div style={{ padding:'10px 14px', borderRadius:'8px', fontSize:'13px', background:'var(--red-bg)', border:'1px solid var(--red-bd)', color:'var(--red)' }}>
                {erro}
              </div>
            )}

            {ok && (
              <div style={{ padding:'10px 14px', borderRadius:'8px', fontSize:'13px', background:'rgba(34,197,94,.08)', border:'1px solid rgba(34,197,94,.25)', color:'#4ade80' }}>
                {ok}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
              background: 'linear-gradient(135deg,#c9a84c,#e8c97a)',
              color: '#0c0c0e', border: 'none', marginTop: '4px',
              opacity: loading ? .7 : 1, transition: 'opacity .2s', cursor: loading ? 'default' : 'pointer',
            }}>
              {loading ? (modo === 'login' ? 'Entrando…' : 'Criando conta…') : (modo === 'login' ? 'Entrar' : 'Criar conta grátis')}
            </button>
          </form>

          {modo === 'cadastro' && (
            <p style={{ fontSize: '11px', color: 'var(--txt3)', textAlign: 'center', marginTop: '16px', marginBottom: 0 }}>
              Ao criar sua conta você recebe <strong style={{ color: 'var(--txt2)' }}>7 dias grátis</strong> de acesso completo.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
