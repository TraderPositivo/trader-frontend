import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function EsqueceuSenha() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro,    setErro]    = useState('')

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: '8px', fontSize: '14px',
    background: 'var(--bg3)', border: '1px solid var(--border2)',
    color: 'var(--txt)', outline: 'none', boxSizing: 'border-box',
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      await api.post('auth', { action: 'solicitar_reset', email })
      setEnviado(true)
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <img src="/logo-shield.png" alt="GesRisk Trader" width="72" height="72"
            style={{ marginBottom: '14px', borderRadius: '14px', objectFit: 'contain' }} />
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt)' }}>
            Ges<span style={{ color: 'var(--gold)' }}>Risk</span> Trader
          </div>
        </div>

        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: '14px', padding: '32px',
        }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700, color: 'var(--txt)' }}>
            Recuperar senha
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'var(--txt3)' }}>
            Digite o e-mail cadastrado e enviaremos um link para você criar uma nova senha.
          </p>

          {enviado ? (
            <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)', color: '#4ade80', fontSize: '14px' }}>
              ✓ Se este e-mail estiver cadastrado, você receberá as instruções em breve. Verifique também a caixa de spam.
              <div style={{ marginTop: '16px' }}>
                <Link to="/login" style={{ color: 'var(--gold)', fontSize: '13px' }}>← Voltar para o login</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt2)', display: 'block', marginBottom: '6px' }}>
                  E-mail
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com" required style={inp}
                  onFocus={e => e.target.style.borderColor = 'var(--gold-bd)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
              </div>

              {erro && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', background: 'var(--red-bg)', border: '1px solid var(--red-bd)', color: 'var(--red)' }}>
                  {erro}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
                background: 'linear-gradient(135deg,#00c87a,#39ffa8)',
                color: '#0c0c0e', border: 'none',
                opacity: loading ? .7 : 1, cursor: loading ? 'default' : 'pointer',
              }}>
                {loading ? 'Enviando…' : 'Enviar link de recuperação'}
              </button>

              <p style={{ textAlign: 'center', margin: 0 }}>
                <Link to="/login" style={{ fontSize: '12px', color: 'var(--txt3)', textDecoration: 'none' }}>
                  ← Voltar para o login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
